#!/usr/bin/env ts-node

// pnpm run update-resource

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resources, ResourceType } from "@/lib/db/schema/resources";
import * as dotenv from 'dotenv';
import fs from 'fs';
import FirecrawlApp, { ScrapeResponse } from "@mendable/firecrawl-js";
import { createResource } from "@/lib/actions/resources";
import { media } from "@/lib/db/schema/media";
import { describeImageOrGifFromResource } from "@/lib/google";
import { url } from "inspector";

// Load environment variables from .env file
dotenv.config();

var scrapeAndCreateResource = true;
var resourceUrl = "https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties"
const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

async function main() {

    var resource = null;
    const resourcesFromDb = await db.select().from(resources).where(eq(resources.url, resourceUrl));
    if (scrapeAndCreateResource) {
        const scrapeResult = await app.scrapeUrl(resourceUrl, { formats: ['markdown', 'html'] }) as ScrapeResponse;

        if (!scrapeResult.success) {
            throw new Error(`Failed to crawl: ${scrapeResult.error}`)
        }

        if (scrapeResult.markdown) {
            // Save the markdown to a file
            fs.writeFileSync('scrapeResult.md', scrapeResult.markdown);
        } else {
            throw new Error(`Failed to get markdown: ${scrapeResult.error}`)
        }

        
        // If there is a resource, delete it
        if (resourcesFromDb.length > 0) {
            await db.delete(resources).where(eq(resources.url, resourceUrl));
        }

        // Use the createResource function
        const title = scrapeResult.title || scrapeResult.metadata?.title || '';
        const description = scrapeResult.description || scrapeResult.metadata?.description || '';

        resource = await createResource({
            url: resourceUrl,
            type: ResourceType.URL,
            content: scrapeResult.markdown,
            title: title,
            description: description,
            source: 'figma_docs',
        });

        console.log("Resource created: ", title, description);
    } else {
        resource = resourcesFromDb[0];
    }

    try {

        const extractedData = resource.content.match(/\[[^\[\]]+\]\(https:\/\/help\.figma\.com\/hc\/article_attachments\/(\d+)\)/g);

        // Now I need to verify if in [name] part there is .svg 
        const extractedDataWithoutSvg = extractedData?.filter(item => !item.includes('.svg') && item.includes('article_attachments'));
        // Now I need to remove the [name] part and keep only the url
        const extractedUrlsFromArticleAttachments = extractedDataWithoutSvg?.map(item => item.split('](')[1].replace(')', ''));

        // resource.content is a markdown content. I need to extract all the urls in this markdown that ends with .png
        // THey only need to be an url and end with png. thats it. i need a regex that is able to extract this
        const urlsThatEndWithPng = resource.content.match(/\bhttps?:\/\/\S+\.png\b/g);
        const urlsThatEndWithPngAndAreNotArticleAttachments = urlsThatEndWithPng?.filter(item => !item.includes('article_attachments'));
        console.log("urlsThatEndWithPngAndAreNotArticleAttachments: ", urlsThatEndWithPngAndAreNotArticleAttachments);

        var imagesAndGifsUrls: string[] = []
        if (extractedUrlsFromArticleAttachments) {
            imagesAndGifsUrls = [...imagesAndGifsUrls, ...extractedUrlsFromArticleAttachments]
        }
        if (urlsThatEndWithPngAndAreNotArticleAttachments) {
            imagesAndGifsUrls = [...imagesAndGifsUrls, ...urlsThatEndWithPngAndAreNotArticleAttachments]
        }


        if (imagesAndGifsUrls.length > 0) {
            // Get all media from the resource
            const allResourceMedia = await db.select().from(media).where(eq(media.resourceId, resource.id));
            if (imagesAndGifsUrls.length === allResourceMedia.length) {
                console.log("All images and gifs already exist for the resource: ", url);
                return;
            }
            for (var imageAndGifUrl of imagesAndGifsUrls) {
                const resourceMedia = allResourceMedia.find(media => media.url === imageAndGifUrl);
                if (resourceMedia) continue;
                try {
                    const { description, mimeType } = await describeImageOrGifFromResource(imageAndGifUrl, resource.title, resource.description);
                    await db.insert(media).values({
                        url: imageAndGifUrl,
                        mimeType: mimeType,
                        description: description,
                        resourceId: resource.id,
                    });
                    console.log("Media created: ", imageAndGifUrl, description, mimeType);
                } catch (error) {
                    if (error instanceof Error && error.message === "SVG not supported") {
                        // This is fine, we can ignore it
                        console.error("Caught an unsupported SVG error:", error.message);
                    } else if (error instanceof Error && error.message === "File too large") {
                        // This is fine, we can ignore it
                        console.error("Caught a file too large error:", error.message);
                    } else if (error instanceof Error && error.message === "GIF not supported") {
                        // This is fine, we can ignore it
                        console.error("Caught a GIF not supported error:", error.message);
                    } else if (error instanceof Error && error.message == "Failed to fetch image or gif") {
                        // This is fine, we can ignore it
                        console.error("Caught a failed to fetch image or gif error:", error.message);
                    } else {
                        console.error("An error occurred:", error);
                        // This is not fine, we need to throw an error
                        throw error;
                    }
                }
            }

            console.log("Finished adding images  for the resource: ", resourceUrl);
        }
    } catch (error) {
        console.error("Error creating resource: ", resourceUrl, error);
    }

}

main();