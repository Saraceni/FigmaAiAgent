import { callClaudeApi } from "@/app/design/designAgent";


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;



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

        const result = await callClaudeApi(userRequest, constraints)

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
