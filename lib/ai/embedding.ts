import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '../db';
import { and, cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import { embeddings } from '../db/schema/embeddings';
import { resources } from '../db/schema/resources';

const embeddingModel = openai.embedding('text-embedding-ada-002');
export const DEFAULT_CHUNK_SIZE = 10000;
export const DEFAULT_OVERLAP = 1000;
const MAX_TOKEN_COUNT = 128000

export const generateChunks = (text: string, chunkSize: number = DEFAULT_CHUNK_SIZE, overlap: number = DEFAULT_OVERLAP): string[] => {
    const chunks = [];
    let start = 0;
    const textLength = text.length;

    while (start < textLength) {
        // Calculate end position
        let end = start + chunkSize;

        // If we're at the end of the text, just take what's left
        if (end >= textLength) {
            chunks.push(text.slice(start).trim());
            break;
        }

        // Try to find a code block boundary first (```)
        let chunk = text.slice(start, end);
        const codeBlock = chunk.lastIndexOf('```');
        if (codeBlock !== -1 && codeBlock > chunkSize * 0.3) {
            end = start + codeBlock;
        }
        // If no code block, try to break at a paragraph
        else if (chunk.includes('\n\n')) {
            // Find the last paragraph break
            const lastBreak = chunk.lastIndexOf('\n\n');
            if (lastBreak > chunkSize * 0.3) {  // Only break if we're past 30% of chunkSize
                end = start + lastBreak;
            }
        }
        // If no paragraph break, try to break at a sentence
        else if (chunk.includes('. ')) {
            // Find the last sentence break
            const lastPeriod = chunk.lastIndexOf('. ');
            if (lastPeriod > chunkSize * 0.3) {  // Only break if we're past 30% of chunkSize
                end = start + lastPeriod + 1; // +1 to include the period
            }
        }

        // Extract chunk and clean it up
        chunk = text.slice(start, end).trim();
        if (chunk) {
            chunks.push(chunk);
        }

        // Move start position for next chunk
        start = Math.max(start + 1, end);
    }

    return chunks;
};

export const generateEmbeddings = async (
    value: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    overlap: number = DEFAULT_OVERLAP,
): Promise<Array<{ embedding: number[]; content: string, chunkSize: number, overlap: number }>> => {

    const chunks = generateChunks(value, chunkSize, overlap);
    var embeddingsGenerated: Array<{ embedding: number[]; content: string }> = [];

    for (const chunk of chunks) {
        console.log(`Embedding chunk: ${chunk.length} tokens`);
        const { embedding } = await embed({
            model: embeddingModel,
            value: chunk,
        });
        embeddingsGenerated.push({ embedding, content: chunk });
    }

    return embeddingsGenerated.map((e, i) => ({ content: chunks[i], embedding: e.embedding, chunkSize, overlap }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
    const input = value.replaceAll('\\n', ' ');
    const { embedding } = await embed({
        model: embeddingModel,
        value: input,
    });
    return embedding;
};

export const findRelevantContent = async (userQuery: string, source: string) => {
    var log = false
    try {
        const userQueryEmbedded = await generateEmbedding(userQuery);
        const similarity = sql<number>`1 - (${cosineDistance(
            embeddings.embedding,
            userQueryEmbedded,
        )})`;
        const similarEmbeddings = await db
            .select({ embeddingId: embeddings.id, content: embeddings.content, similarity, resourceId: resources.id, resourceContent: resources.content, resourceTitle: resources.title, resourceDescription: resources.description })
            .from(embeddings)
            .innerJoin(resources, eq(embeddings.resourceId, resources.id)) // Join the resources table
            .where(and(gt(similarity, 0.7), eq(resources.source, source)))
            .orderBy(t => desc(t.similarity))
            .limit(10)

        var tokenCount = 0
        var result: { content: string, id: string, title: string, description: string, contentSource: 'resource' | 'embedding' | 'hybrid' }[] = []
        var processedResources = new Set<string>()

        // First pass: Add the most relevant embeddings
        for (const embedding of similarEmbeddings) {
            if (processedResources.has(embedding.resourceId)) continue;

            if (tokenCount + embedding.content.length <= MAX_TOKEN_COUNT) {
                result.push({
                    content: embedding.content,
                    id: embedding.embeddingId,
                    title: embedding.resourceTitle,
                    description: embedding.resourceDescription,
                    contentSource: 'embedding'
                })
                tokenCount += embedding.content.length
                processedResources.add(embedding.resourceId)
            } else {
                break
            }
        }

        // Second pass: For high-similarity embeddings, try to add context from the full resource
        for (const embedding of similarEmbeddings) {
            if (embedding.similarity < 0.85) continue; // Only for very high similarity
            
            const resourceContentWithExtraLinesRemoved = embedding.resourceContent.replaceAll('\n\n', '\n').replaceAll('\n\n\n', '\n')
            
            // Check if we can add the full resource without exceeding limits
            if (tokenCount + resourceContentWithExtraLinesRemoved.length <= MAX_TOKEN_COUNT) {
                // Replace the embedding with the full resource
                const existingIndex = result.findIndex(r => r.id === embedding.embeddingId)
                if (existingIndex !== -1) {
                    result[existingIndex] = {
                        content: resourceContentWithExtraLinesRemoved,
                        id: embedding.resourceId,
                        title: embedding.resourceTitle,
                        description: embedding.resourceDescription,
                        contentSource: 'resource'
                    }
                    tokenCount = tokenCount - embedding.content.length + resourceContentWithExtraLinesRemoved.length
                    log && console.log(`Upgraded to full resource for ${embedding.resourceTitle}`)
                }
            } else if (tokenCount + embedding.content.length <= MAX_TOKEN_COUNT * 0.8) {
                // If we have room for some context, try to add a hybrid approach
                const contextWindow = Math.floor((MAX_TOKEN_COUNT - tokenCount) * 0.3) // Use 30% of remaining space for context
                const resourceContent = resourceContentWithExtraLinesRemoved
                
                // Find the embedding content in the resource and extract surrounding context
                const embeddingIndex = resourceContent.indexOf(embedding.content)
                if (embeddingIndex !== -1) {
                    const start = Math.max(0, embeddingIndex - contextWindow / 2)
                    const end = Math.min(resourceContent.length, embeddingIndex + embedding.content.length + contextWindow / 2)
                    const contextualContent = resourceContent.substring(start, end)
                    
                    if (tokenCount + contextualContent.length <= MAX_TOKEN_COUNT) {
                        const existingIndex = result.findIndex(r => r.id === embedding.embeddingId)
                        if (existingIndex !== -1) {
                            result[existingIndex] = {
                                content: contextualContent,
                                id: embedding.embeddingId,
                                title: embedding.resourceTitle,
                                description: embedding.resourceDescription,
                                contentSource: 'hybrid'
                            }
                            tokenCount = tokenCount - embedding.content.length + contextualContent.length
                            log && console.log(`Added contextual content for ${embedding.resourceTitle}`)
                        }
                    }
                }
            }
        }

        log && console.log(`Final token count: ${tokenCount}, Results: ${result.length}`);
        return result;
    } catch (error) {
        console.error(error);
        return [];
    }
};