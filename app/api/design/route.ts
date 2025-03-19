import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

interface StyleGuide {
    name: string;
    description: string;
}

interface DesignConstraints {
    colorPalette?: string[];
    styleGuide?: StyleGuide;
}

function createPrompt(userRequest: string, constraints: DesignConstraints): string {
    return `
      I need you to create a specific UI component that exactly matches this description: "${userRequest}"
      
      IMPORTANT: Your design MUST directly address all requirements in the description above.
      
      Color palette: ${constraints.colorPalette?.join(', ') || 'Use appropriate colors'}
      Style guide: ${JSON.stringify(constraints.styleGuide) || 'Modern, clean design'}
      
      The component should be:
      - Fully functional for the exact purpose described
      - Responsive and accessible
      - Ready to use with complete HTML and CSS
      
      Include detailed color information (hex codes, usage context).
      Explain key styling decisions that relate specifically to the requested component.
      
      Before submitting, verify that your component fully satisfies the requirements in: "${userRequest}"
    `;
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const systemPrompt = `You are DesignGPT, an expert AI assistant specialized in creating visual user interfaces, components and elements for websites and applications. Your purpose is to generate high-quality, accessible, and responsive HTML and CSS based on user descriptions.

## YOUR CAPABILITIES:
- Generate complete, ready-to-use HTML and CSS for UI components
- Provide detailed color information and styling decisions
- Create components that follow modern design principles
- Ensure accessibility compliance (WCAG 2.1 AA standard)
- Adapt to specific design systems and constraints

## OUTPUT FORMAT:
Always structure your response in these sections:

1. COMPONENT PREVIEW (description of what you've created)
2. HTML CODE (complete, valid HTML) [string]
3. CSS CODE (complete, optimized CSS) [string]
4. COLOR DETAILS (list each color with hex code and usage context) [array of objects with hex and usage]
5. STYLING NOTES (explain key design decisions) [string]

## OUTPUT EXAMPLE:
{
    "component": {
        "html": "<div class='container'>...</div>",
        "css": "...",
        "colorDetails": [{"hex": "#3B82F6", "usage": "background color"}],
        "stylingNotes": "The container is styled with a background color and a border radius."
    }
}

## GUIDELINES:
- Prioritize clean, semantic HTML5
- Use flexbox and CSS grid for layouts
- Ensure responsive design works on mobile, tablet, and desktop
- Include hover states and transitions where appropriate
- Comment your CSS to explain complex styling
- Use relative units (rem, em, %) over fixed units when possible
- Follow accessibility best practices (contrast ratios, aria attributes)
- When no specific colors are provided, use a harmonious, accessible color palette

## CONSTRAINTS:
- Do not include external dependencies unless specifically requested
- Do not use inline styles; keep all styling in the CSS section
- Ensure all HTML elements have appropriate semantic meaning
- Never leave placeholder content without explanation
- Always validate that your HTML and CSS will work together as written

When the user provides specific constraints like color palettes, design systems, or responsive breakpoints, strictly adhere to these requirements in your generated component.`

const ComponentOutputSchema = z.object({
    component: z.object({
        html: z.string(),
        css: z.string(),
        colorDetails: z.array(z.object({
            hex: z.string(),
            usage: z.string(),
        })),
        stylingNotes: z.string(),
    }),
});

// To try
// I need a component to change the state of a list. the component can be use to select all elements of the 
// list and also to deselect all the elements. there is also the case where some elements of the list can 
// be selected but not all. the component should show all the three states ( all selected, all deselected, 
// partially selected )


export async function POST(req: Request) {

    try {
        const { chatId, userRequest, constraints } = await req.json();

        if(!userRequest) {
            return new Response('No user request', { status: 400 });
        }

        const prompt = createPrompt(userRequest, constraints || {});
        const model = anthropic('claude-3-7-sonnet-20250219');

        const { object } = await generateObject({
            model,
            system: systemPrompt,
            prompt: prompt,
            schemaName: "component",
            schemaDescription: "The component to be created",
            schema: ComponentOutputSchema,
            maxTokens: 40000,
        });

        const result = object;
        console.log("result", result);

        if (!result) {
            return new Response('No result', { status: 400 });
        } else {
            return new Response(JSON.stringify(result.component), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

    } catch (error) {
        console.error('Error processing request:', error); // Log the error for debugging
        return new Response('Internal Server Error', { status: 500 }); // Return a 500 response
    }
}
