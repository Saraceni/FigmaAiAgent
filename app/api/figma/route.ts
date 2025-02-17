import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { resources, ResourceType } from '@/lib/db/schema/resources';
import { media } from '@/lib/db/schema/media';
import fs from 'fs';
import path from 'path';
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js';
import { createResource } from '@/lib/actions/resources';
import { describeImageOrGifFromResource } from '@/lib/google';

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function GET(req: Request) {

    const currentFilePath = import.meta.url;
    const currentDirectory = path.dirname(currentFilePath);

    const urlsFile = path.join(currentDirectory, 'urls.md');
    const urlsFileWithoutFilePrefix = urlsFile.replace('file:', '');

    const data = await fs.promises.readFile(urlsFileWithoutFilePrefix, 'utf8');
    const urlsArray = data.split('\n');

    for (var url of urlsArray) {
        if (url.startsWith('#') || url.length === 0) {
            continue;
        }
        const resource = await db.select().from(resources).where(eq(resources.url, url));
        if (resource.length > 0) {
            console.log("Resource already exists: ", url);
            // Get the url of the images and gifs from the resource
            // These urls are in the format: [name](https://help.figma.com/hc/article_attachments/{id})
            const extractedData = resource[0].content.match(/\[[^\[\]]+\]\(https:\/\/help\.figma\.com\/hc\/article_attachments\/(\d+)\)/g);
            console.log("Extracted data: ", extractedData);
            // Now I need to verify if in [name] part there is .svg 
            const extractedDataWithoutSvg = extractedData?.filter(item => !item.includes('.svg') && item.includes('article_attachments'));
            // Now I need to remove the [name] part and keep only the url
            const imagesAndGifsUrls = extractedDataWithoutSvg?.map(item => item.split('](')[1].replace(')', ''));
            if (imagesAndGifsUrls) {
                // Get all media from the resource
                const allResourceMedia = await db.select().from(media).where(eq(media.resourceId, resource[0].id));
                if(imagesAndGifsUrls.length === allResourceMedia.length) {
                    console.log("All images and gifs already exist for the resource: ", url);
                    continue;
                }
                for (var imageAndGifUrl of imagesAndGifsUrls) {
                    const resourceMedia = allResourceMedia.find(media => media.url === imageAndGifUrl);
                    if (resourceMedia) continue;
                    try {
                        const { description, mimeType } = await describeImageOrGifFromResource(imageAndGifUrl, resource[0].title, resource[0].description);
                        await db.insert(media).values({
                            url: imageAndGifUrl,
                            mimeType: mimeType,
                            description: description,
                            resourceId: resource[0].id,
                        });
                        console.log("Media created: ", imageAndGifUrl, description, mimeType);
                    } catch(error) {
                        if (error instanceof Error && error.message === "SVG not supported") {
                            // This is fine, we can ignore it
                            console.error("Caught an unsupported SVG error:", error.message);
                        } else {
                            console.error("An error occurred:", error);
                            // This is not fine, we need to throw an error
                            throw error;
                        }
                    }
                }

                console.log("Finished adding images and gifs for the resource: ", url);
            } 

            continue;
        } else {
            const scrapeResult = await app.scrapeUrl(url, { formats: ['markdown', 'html'] }) as ScrapeResponse;

            if (!scrapeResult.success) {
                throw new Error(`Failed to crawl: ${scrapeResult.error}`)
            }

            if (scrapeResult.markdown) {

                // Use the createResource function
                const title = scrapeResult.title || scrapeResult.metadata?.title || '';
                const description = scrapeResult.description || scrapeResult.metadata?.description || '';

                try {
                    await createResource({
                        url: url,
                        type: ResourceType.URL,
                        content: scrapeResult.markdown,
                        title: title,
                        description: description,
                        source: 'figma_docs',
                    });

                    console.log("Resource created: ", title, description);
                } catch (error) {
                    console.error("Error creating resource: ", title, error);
                    break;
                }

                // I need to wait some random time between 0.7 and 1.5 seconds
                const waitTime = Math.floor(Math.random() * 800) + 700;
                await new Promise(resolve => setTimeout(resolve, waitTime));

            }
        }
    }

    return new Response("Scrapping data", {
        status: 200,
    })
}