import { openai } from '@ai-sdk/openai';
import { google } from "@ai-sdk/google";
import { streamText } from 'ai';
import { findRelevantContent } from '@/lib/ai/embedding';
import { z } from 'zod';
import { getMediasDescriptionFromUrl } from '@/lib/actions/media';


const systemPrompt = `You are an AI assistant designed to help users understand and utilize Figma. You have access to the Figma documentation using the tool "searchFigmaDocs".
Figma is a powerful, collaborative design tool for teams. It brings together powerful design tools with multiplayer collaboration, allowing teams to explore ideas while capturing quality feedback in real time—or anytime.
Whenever you find an url in the documentation, you should use the tool "getMediasDescription" to get the description of the images and gifs.
You have access to a tool that provides a description of any image or GIF you find in the documentation. Use this tool to understand the content of the images and gifs.
All images and gifs returned in the markdown have a url in the format: 'https://help.figma.com/hc/article_attachments/{id}'. If you find an image or gif in the documentation, use the tool to get the description of the image or gif.
Always call the right tool to get the correct information.
Your responses should be informative, friendly, and focused on helping users achieve their design goals using Figma.
When answering questions about figma, only respond to questions using information from tool calls or system prompt. Don't make up information or respond with information that is not in the tool calls or system prompt.
If the user asks questions that are not related to Figma, or your capabilities, functionalities and objectives as an AI assistant, respond, respond based on the system prompt.
If the user asks what is Figma, or what Figma does, answer based on the system prompt.
If the user asks what are you, your specialities or questions related about your capabilities, answer based on the system prompt.
If no relevant information is found in the tool calls, respond, "Sorry, I couldn't find an answer on the documentation. Can you please elaborate your question in a different way?".
Your answer should be in markdown format. Always include images, gifs, and links from the tool calls in the markdown format. 
When providing images or gifs, use the following markdown syntax: ![Image Description](image_or_gif_url). 
Figma is a very visual tool, so it's important to include images, gifs, and links from the tool calls.
`

export const callFigmaAgent = async (userRequest: string, modelProvider = 'openai') => {
    const model = modelProvider === 'google' ? google("gemini-2.0-flash-001", { structuredOutputs: true }) : openai('gpt-4o-mini');

    const result = streamText({
        model,
        system: systemPrompt,
        topP: 0.1,
        prompt: userRequest,
        tools: {
            searchFigmaDocs: {
                description: 'Search the Figma documentation for information',
                parameters: z.object({
                    question: z.string().describe('the users question'),
                }),
                execute: async ({ question }) => {
                    return findRelevantContent(question, 'figma_docs')
                },
            },
            getMediasDescription: {
                description: 'Get the description of the images and gifs from the documentation',
                parameters: z.object({
                    urls: z.array(z.string()).describe('the urls of the images and gifs'),
                }),
                execute: async ({ urls }) => {
                    console.log("Getting medias description from urls");
                    return getMediasDescriptionFromUrl(urls)
                },
            },
        },
    });

    return result
}