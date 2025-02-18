import { openai } from '@ai-sdk/openai';
import { google } from "@ai-sdk/google";
import { InvalidToolArgumentsError, NoSuchToolError, streamText, ToolExecutionError } from 'ai';
import { findRelevantContent } from '@/lib/ai/embedding';
import { z } from 'zod';
import { getMediasDescriptionFromUrl } from '@/lib/actions/media';
import { db } from '@/lib/db';
import { chat } from '@/lib/db/schema/chat';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const systemPrompt = `You are an AI assistant designed to help users understand and utilize Figma. You have access to the Figma documentation using the tool "searchFigmaDocs".
Figma is a powerful, collaborative design tool for teams. It brings together powerful design tools with multiplayer collaboration, allowing teams to explore ideas while capturing quality feedback in real time—or anytime.
Whenever you find an url in the documentation, you should use the tool "getMediasDescription" to get the description of the images and gifs.
You have access to a tool that provides a description of any image or GIF you find in the documentation. Use this tool to understand the content of the images and gifs.
All images and gifs returned in the markdown have a url in the format: 'https://help.figma.com/hc/article_attachments/{id}'. If you find an image or gif in the documentation, use the tool to get the description of the image or gif.
Always call the right tool to get the correct information.
Your responses should be informative, friendly, and focused on helping users achieve their design goals using Figma.
Only respond to questions using information from tool calls. Don't make up information or respond with information that is not in the tool calls.
If the user asks questions that are not related to Figma, respond, "Sorry, I don't know. Please ask a question related to Figma".
If no relevant information is found in the tool calls, respond, "Sorry, I couldn't find an answer on the documentation. Can you please elaborate your question in a different way?".
Your answer should be in markdown format. Always include images, gifs, and links from the tool calls in the markdown format. 
When providing images or gifs, use the following markdown syntax: ![Image Description](image_or_gif_url). 
Figma is a very visual tool, so it's important to include images, gifs, and links from the tool calls.
`
// These are some questions that I know are not very well answered by the tool calls
// how do i add default line height to my text-sm
// set it default for the text-sm utility class
// how do I add a default value to line height on my text-sm class?

export async function POST(req: Request) {
  try {
    const { messages, modelProvider = 'openai', chatId } = await req.json();

    const model = modelProvider === 'google' ? google("gemini-2.0-flash-001", { structuredOutputs: true }) : openai('gpt-4o-mini');

    // let model = google("gemini-2.0-flash-001", {
    //   structuredOutputs: true,
    // }) 

    // Use search grounding to get info from google search
    // model: google('gemini-1.5-pro', {
    //   useSearchGrounding: true,
    // }),

    const result = streamText({
      model,
      system: systemPrompt,
      topP: 0.1,
      messages,
      onFinish: (message) => {
        if(process.env.ENVIRONMENT === 'dev') {
          console.log("Skipping chat save for dev session"); return;
        }
        if (message.finishReason === 'stop') {
          // Get the answer:
          const response = message.text;
          const modelId = message.response.modelId;
          // Get last message where role = 'user'

          const lastUserMessage = [...messages].reverse().find((message: any) => message.role === 'user').content;
          db.insert(chat).values({ sessionId: chatId, response, modelId, question: lastUserMessage }).then(() => {
            console.log("Chat saved to database");
          }).catch((error) => {
            console.error("Error saving chat to database", error);
          });
        }
      },
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

    for await (const part of result.fullStream) {
      switch (part.type) {
        // ... handle other part types

        case 'error': {
          const error = part.error
          // This works
          console.error(error)
          break
        }
      }
    }

    return result.toDataStreamResponse({
      getErrorMessage: error => {
        if (NoSuchToolError.isInstance(error)) {
          console.log('The model tried to call a unknown tool.', error)
          return 'The model tried to call a unknown tool.';
        } else if (InvalidToolArgumentsError.isInstance(error)) {
          console.log('The model called a tool with invalid arguments.', error)
          return 'The model called a tool with invalid arguments.';
        } else if (ToolExecutionError.isInstance(error)) {
          console.log('An error occurred during tool execution.', error)
          return 'An error occurred during tool execution.';
        } else {
          console.log('An unknown error occurred.', error)
          return 'An unknown error occurred.';
        }
      },
    });
  } catch (error) {
    console.error('Error processing request:', error); // Log the error for debugging
    return new Response('Internal Server Error', { status: 500 }); // Return a 500 response
  }
}
