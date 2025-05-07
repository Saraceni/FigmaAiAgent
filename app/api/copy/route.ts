import codeToDesign from "./codeToDesign";



export async function POST(req: Request) {
    const { html, css } = await req.json();

    const { clipboardDataFromAPI } = await codeToDesign(html, css);

    return new Response(JSON.stringify({ clipboardDataFromAPI }), {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}