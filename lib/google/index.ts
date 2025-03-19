// I decided to create a separate library for the google gemini model because it doesn't work with the ai sdk 

// Docs for refering:
// Vision: https://ai.google.dev/gemini-api/docs/vision?lang=node

// Models: https://ai.google.dev/gemini-api/docs/models/gemini
// Pricing: https://ai.google.dev/gemini-api/docs/pricing

// Models with video support:
// gemini-2.0-flash, gemini-2.0-flash-lite-preview-02-05, gemini-1.5-flash, gemini-1.5-flash-8b, gemini-1.5-pro

// With metadata, each second of video becomes ~300 tokens, which means a 1M context window can fit slightly less than an hour of video.
// 	Paid Tier, per 1M tokens in USD
// 4 characters result in approximately 1 text token including white space.
//For an 1024x1024 image, it consumes 1290 tokens. Per image token count varies by image resolution. For more information on how to calculate tokens, you can refer to our documentation.
// gemini-2.0-flash - $0.10 (text / image / video)
// gemini-2.0-flash-lite-preview-02-05 - $0.075
// gemini-1.5-flash - $0.075, prompts <= 128k tokens / $0.15, prompts > 128k tokens

// To use the File API, use this import path for GoogleAIFileManager.
// Note that this is a different import path than what you use for generating content.
// For versions lower than @google/generative-ai@0.13.0
// use "@google/generative-ai/files"

import { GoogleAIFileManager, FileState, FileMetadataResponse } from "@google/generative-ai/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import fs from "fs";

// Converts local file information to base64
const fileToGenerativePart = (path: string, mimeType: string) => {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

const videoInfoSchema = {
    description: "List of parts of the video",
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            start: {
                type: SchemaType.NUMBER,
                description: "Start timestamp of the part of the video in seconds",
                nullable: false,
            },
            end: {
                type: SchemaType.NUMBER,
                description: "End timestamp of the part of the video in seconds",
                nullable: false,
            },
            description: {
                type: SchemaType.STRING,
                description: "Description of the part of the video",
                nullable: false,
            },
        },
        required: ["start", "end", "description"],
    },
};

export const extractVideoInformation = async (videoPath: string) => {

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }

    // Initialize GoogleAIFileManager with your GEMINI_API_KEY.
    const fileManager = new GoogleAIFileManager(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    // Get filename from path
    const fileName = videoPath.split("/").pop();

    if (!fileName) throw new Error("File name not found");

    let file: FileMetadataResponse | null = null;

    // Search for a file with the display name
    const listFilesResponse = await fileManager.listFiles();
    for (const listedFile of listFilesResponse.files) {
        if (listedFile.displayName === fileName) { file = listedFile; break; }
    }

    if (!file) {
        // Upload the file and specify a display name.
        const uploadResponse = await fileManager.uploadFile(videoPath, { mimeType: "video/mp4", displayName: fileName });

        // View the response.
        console.log(`Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`);
        //const name = uploadResponse.file.name;
        file = uploadResponse.file;
    }

    // Poll getFile() on a set interval (10 seconds here) to check file state.
    //let file = await fileManager.getFile(name);
    while (file.state === FileState.PROCESSING) {
        process.stdout.write(".")
        // Sleep for 10 seconds
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        // Fetch the file from the API again
        file = await fileManager.getFile(fileName)
    }

    if (file.state === FileState.FAILED) throw new Error("Video processing failed.");

    // When file.state is ACTIVE, the file is ready to be used for inference.
    console.log(`File ${file.displayName} is ready for inference as ${file.uri}`);

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: videoInfoSchema,
        },
    });

    // Generate content using text and the URI reference for the uploaded file.
    const result = await model.generateContent([
        {
            fileData: {
                mimeType: file.mimeType,
                fileUri: file.uri
            }
        },
        { text: "This video is a tutorial on how to use Figma, a design tool. My user needs to be able to search for specific parts of the video. I need to be able to extract the detailed information in each part of the video, including the timestamps and visual descriptions." },
    ]);

    // Handle the response of generated text
    console.log(result.response.text())

    return result;
}

export const describeImageOrGifFromResource = async (fileURL: string, resourceTitle: string, resourceDescription: string) => {


    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }

    const { mimeType, buffer } = await fetch(fileURL, { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error("Failed to fetch image or gif");
        return response.arrayBuffer().then((buffer) => {
            const mimeType = response.headers.get('Content-Type');
            // If the file has more than 20971520 bytes I can't upload it to google
            if(mimeType === 'image/svg+xml') throw new Error("SVG not supported");
            if(buffer.byteLength > 17000000) throw new Error("File too large");
            return { mimeType, buffer };
        })
    });

    if (!mimeType || !buffer) throw new Error("Failed to fetch image or gif");
    console.log("mimeType", mimeType, "url", fileURL)

    const prompt = `You are a helpful assistant that can describe images and gifs.
    You are given a resource title and description, and an image or gif.
    The file you are analyzing was extracted from the Figma documentation. Figma is a design tool.
    The section of the Figma documentation has the title "${resourceTitle}" and the description "${resourceDescription}".
    You need to describe the image or gif in a way that is helpful to the user.
    The resource title is ${resourceTitle} and the resource description is ${resourceDescription}.
    Answer with just the description, no other text.`

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(buffer).toString("base64"),
                mimeType
            },
        },
        prompt
    ]);

    // Handle the response of generated text
    console.log(result.response.text())

    return { mimeType, description: result.response.text() };
}


