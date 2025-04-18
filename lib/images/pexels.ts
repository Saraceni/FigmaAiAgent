

export interface PhotoResource {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: number;
    avg_color: string;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    },
    liked: boolean;
    alt: string;
}

export interface PexelsResponse {
    total_results: number;
    page: number;
    per_page: number;
    photos: PhotoResource[];
    next_page: string;
}


export const srcDescription = `original: The image without any size changes. It will be the same as the width and height attributes.
large2x: The image resized W 940px X H 650px DPR 2
large: The image resized to W 940px X H 650px DPR 1.
medium: The image scaled proportionally so that it's new height is 350px.
small: The image scaled proportionally so that it's new height is 130px.
portrait: The image cropped to W 800px X H 1200px.
landscape: The image cropped to W 1200px X H 627px.
tiny: The image cropped to W 280px X H 200px.`;

export const getImagesFromPexels = async (query: string) => {
    const queryUrlEncoded = encodeURI(query)
    const response = await fetch(`https://api.pexels.com/v1/search?query=${queryUrlEncoded}&per_page=10&page=1`, {
        headers: {
            Authorization: process.env.PEXELS_API_KEY as string
        }
    });
    return response.json() as Promise<PexelsResponse>;
}

// Can you help me find an image for a post about red lipstick? It should feature a women dressed nicely and wearing red listpick looking at the camera.
