#!/usr/bin/env ts-node

// Import your existing code
import { db } from '../lib/db';
import { resources } from '../lib/db/schema/resources';
import fs from 'fs';
import path from 'path';
// ... other imports

async function main() {
    // I Need to get all the resources from the database
    const result = await db.select().from(resources);
    
    // Create an array to store broken URL data
    const brokenUrls: {
        resourceId: string;
        resourceUrl: string;
        brokenUrl: string;
        statusCode: string;
        errorMessage: string;
    }[] = [];
    
    // I need to verify if the url of the resource is present in the content of the resource
    for (const resource of result) {
        const resourceId = resource.id;
        const resourceUrl = resource.url;
        const content = resource.content;

        // The content is a markdown content. I need to verify if all the urls present in the content are working
        console.log(`Verifying ${resourceUrl}`);
        const urls = content.match(/https?:\/\/[^\s()<>[\]"']+[^\s.,;:!?(){}<>[\]"']/g);
        if (urls) {
            for (const url of urls) {
                try {
                    // Clean up the URL - remove trailing punctuation that might be part of markdown
                    const cleanUrl = url.replace(/[.,;:!?)]+$/, '');

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(cleanUrl, { 
                        method: 'HEAD',  // Use HEAD request to be faster and lighter
                        signal: controller.signal
                    });
                    
                    if (!response.ok) { 
                        console.log(`${cleanUrl} is not working (status: ${response.status})`);
                        brokenUrls.push({
                            resourceId,
                            resourceUrl: resourceUrl || '',
                            brokenUrl: cleanUrl,
                            statusCode: response.status.toString(),
                            errorMessage: ''
                        });
                    }
                } catch (error: any) {
                    console.log(`Error fetching ${url}: ${error.message}`);
                    brokenUrls.push({
                        resourceId,
                        resourceUrl: resourceUrl || '',
                        brokenUrl: url,
                        statusCode: 'Error',
                        errorMessage: error.message
                    });
                }
            }
        }
    }
    
    // Create CSV content
    let csvContent = "resourceId,resourceUrl,brokenUrl,statusCode,errorMessage\n";
    
    brokenUrls.forEach(item => {
        // Properly escape fields for CSV
        const escapedResourceUrl = `"${item.resourceUrl.replace(/"/g, '""')}"`;
        const escapedBrokenUrl = `"${item.brokenUrl.replace(/"/g, '""')}"`;
        const errorMessage = item.errorMessage ? `"${item.errorMessage.replace(/"/g, '""')}"` : '';
        
        csvContent += `${item.resourceId},${escapedResourceUrl},${escapedBrokenUrl},${item.statusCode},${errorMessage}\n`;
    });
    
    // Write to CSV file
    const outputPath = path.join(__dirname, '../broken-urls.csv');
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`Found ${brokenUrls.length} broken URLs. Results saved to ${outputPath}`);
}

main().catch(console.error);