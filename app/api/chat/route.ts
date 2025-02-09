import { openai } from '@ai-sdk/openai';
import { InvalidToolArgumentsError, NoSuchToolError, streamText, ToolExecutionError } from 'ai';
import { findRelevantContent, returnUpgradeGuide } from '@/lib/ai/embedding';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const systemPrompt = `You are an AI assistant designed to help users understand and utilize Figma. You have access to the Figma documentation using the tool "searchFigmaDocs".
Always assume the information you have about Figma, not retrieved from the documentation, is outdated. The only source of information you can rely is the information you obtain from the documentation.
Always call the right tool to get the correct information.
Your responses should be informative, friendly, and focused on helping users achieve their design goals using Figma.
Only respond to questions using information from tool calls. Don't make up information or respond with information that is not in the tool calls.
If the user asks questions that are not related to Figma, respond, "Sorry, I don't know. Please ask a question related to Figma".
If no relevant information is found in the tool calls, respond, "Sorry, I couldn't find an answer on the documentation. Can you please elaborate your question in a different way?".
Your answer should be in markdown format and must include all the information you have from the tool calls, including images, links, urls and other resources.
`

// These are some questions that I know are not very well answered by the tool calls
// how do i add default line height to my text-sm
// set it default for the text-sm utility class
// how do I add a default value to line height on my text-sm class?

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      topP: 0.1,
      messages,
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