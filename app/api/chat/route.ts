import { openai } from '@ai-sdk/openai';
import { google } from "@ai-sdk/google";
import { InvalidToolArgumentsError, NoSuchToolError, streamText, ToolExecutionError, createDataStreamResponse } from 'ai';
import { findRelevantContent } from '@/lib/ai/embedding';
import { z } from 'zod';
import { getMediasDescriptionFromUrl } from '@/lib/actions/media';
import { db } from '@/lib/db';
import { chat } from '@/lib/db/schema/chat';
import { eq } from 'drizzle-orm';
import { callClaudeApi, ComponentOutput, ComponentOutputSchema } from '@/app/design/designAgent';
import { componentOutputs } from '@/lib/db/schema/componentOutput';
import EventEmitter from 'events';
// Allow streaming responses up to 30 seconds
export const maxDuration = 60;

const systemPrompt = `You are an AI assistant designed to help users understand and utilize Figma and create web components based on Figma designs. 

You have two main capabilities:
1. Help users understand and utilize Figma using the Figma documentation
2. Create web components based on Figma designs or user descriptions

For Figma documentation:
- Use the "searchFigmaDocs" tool to search Figma documentation
- Use "getMediasDescription" tool for any images/GIFs found in docs
- Only use information from tool calls or this system prompt
- Include relevant images and GIFs in markdown format

For web components:
- Use the "createWebComponent" tool to generate components stylingNotes
- The component and its details will be displayed automatically from the tool call result
- Focus on explaining the component's stylingNotes

When users ask about:
- Figma features/usage -> Use searchFigmaDocs tool
- Creating components from Figma designs -> Use createWebComponent tool
- General Figma questions -> Use system prompt info

Always format responses in markdown.
If the user asks questions about Figma, include visual elements when available. 
If the users asks for a component, don't include raw HTML, CSS, color details in your response.
If no relevant information is found, ask for clarification.

Remember: Figma is a powerful, collaborative design tool for teams that brings together design tools with multiplayer collaboration.

Before proving an answer, check the answer you want to provide. If it includes long raw CSS and HTML snippets from the createWebComponent tool, remove them.

CRITICAL INSTRUCTION: After calling the createWebComponent tool, DO NOT include any raw HTML, CSS, colorDetails, in your response. The component will be displayed automatically. Only explain the component's functionality and design decisions.`


export async function POST(req: Request) {

  try {

    const { messages, modelProvider = 'openai', sessionId } = await req.json();
    const model = modelProvider === 'google' ? google("gemini-2.0-flash-001", { structuredOutputs: true }) : openai('gpt-4o-mini');

    const saveChatToDb = (lastUserMessage: any, response: string, modelId: string) => {

      let generatedComponent: ComponentOutput | null = null
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage.role === 'assistant') {
          for (var i = 0; i < lastMessage.toolInvocations.length; i++) {
            const toolInvocation = lastMessage.toolInvocations[i]
            if (toolInvocation.toolName === 'createWebComponent' && toolInvocation.state === 'result') {
              generatedComponent = toolInvocation.result as ComponentOutput
              break;
            }
          }
        }
      }

      db.insert(chat).values({ sessionId, response, modelId, question: lastUserMessage }).returning({ id: chat.id }).then((chat) => {
        if (generatedComponent) {
          db.insert(componentOutputs).values({
            chatId: chat[0].id, // Using the actual chat.id instead of sessionId
            html: generatedComponent._metadata.html,
            css: generatedComponent._metadata.css,
            stylingNotes: generatedComponent.stylingNotes || '',
            colorDetails: JSON.stringify(generatedComponent._metadata.colorDetails || {})
          }).catch((error) => {
            console.error("Error saving component to database", error);
          })
        }
      }).catch((error) => {
        console.error("Error saving chat to database", error);
      });

    };

    const result = streamText({
      model,
      system: systemPrompt,
      topP: 0.1,
      messages,
      onFinish: (result) => {

        if (process.env.ENVIRONMENT === 'dev') {
          console.log("Skipping chat save for dev session"); return;
        }

        if (result.finishReason === 'stop') {

          // Get the answer:
          const response = result.text;
          const modelId = result.response.modelId;

          // Get last message where role = 'user'
          const lastUserMessage = [...messages].reverse().find((message: any) => message.role === 'user').content;

          saveChatToDb(lastUserMessage, response, modelId);
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
        createWebComponent: {
          description: 'Create a web component based on a design description',
          parameters: z.object({
            userRequest: z.string().describe('description of the component to create'),
            constraints: z.object({
              colorPalette: z.array(z.string()).optional(),
              styleGuide: z.object({
                name: z.string(),
                description: z.string()
              }).optional()
            }).optional()
          }),
          execute: async ({ userRequest, constraints }) => {
            try {
              const result = await callClaudeApi(userRequest, constraints)
              const componentData = result.component
              return {
                stylingNotes: componentData.stylingNotes,
                _metadata: {
                  html: componentData.html,
                  css: componentData.css,
                  colorDetails: componentData.colorDetails,
                }
              };
            } catch (err) {
              console.error('Design API error:', err);
              throw new Error(`Failed to create web component: ${err}`);
            }
          },
        },
      },
    });

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
    })

  } catch (error) {
    console.error('Error processing request:', error); // Log the error for debugging
    return new Response('Internal Server Error', { status: 500 }); // Return a 500 response
  }
}

// I need to create a function that get that receives a chatId and returns the chat history
export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) {
    return new Response('sessionId is required', { status: 400 });
  }
  const chatHistory = await db.select().from(chat).where(eq(chat.sessionId, sessionId)).leftJoin(componentOutputs, eq(componentOutputs.chatId, chat.id));
  return new Response(JSON.stringify(chatHistory), { status: 200 });
}