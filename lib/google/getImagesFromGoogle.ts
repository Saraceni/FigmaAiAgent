

export interface GoogleImageSearchApiResult {
    kind: string;
    url: {
        type: string;
        template: string;
    },
    queries: {
        request: [
            {
                title: string;
                totalResults: string;
                searchTerms: string;
                count: number;
                startIndex: number;
                inputEncoding: string;
                outputEncoding: string;
                safe: string;
                cx: string;
                searchType: string;
            }
        ],
        nextPage: [
            {
                title: string;
                totalResults: string;
                searchTerms: string;
                count: number;
                startIndex: number;
                inputEncoding: string;
                outputEncoding: string;
                safe: string;
                cx: string;
                searchType: string;
            }
        ]
    },
    context: {
        title: string;
    },
    searchInformation: {
        searchTime: number;
        formattedSearchTime: string;
        totalResults: string;
        formattedTotalResults: string;
    },
    items: [
        {
            kind: string;
            title: string;
            htmlTitle: string;
            link: string;
            displayLink: string;
            snippet: string;
            htmlSnippet: string;
            mime: string;
            fileFormat: string;
            image: {
                contextLink: string;
                height: number;
                width: number;
                byteSize: number;
                thumbnailLink: string;
                thumbnailHeight: number;
                thumbnailWidth: number;
            }
        }
    ]
}

export const getImagesFromGoogle = async (query: string) => {
    const queryUrlEncoded = encodeURI(query)
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_API_KEY}&cx=${process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID}&searchType=image&q=${queryUrlEncoded}`);
    return response.json() as Promise<GoogleImageSearchApiResult>;
}