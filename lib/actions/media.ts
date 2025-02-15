import { inArray } from "drizzle-orm";
import { db } from "../db";
import { media } from "../db/schema/media";

export const getMediasDescriptionFromUrl = async (urls: string[]) => {
    const medias = await db.select().from(media).where(inArray(media.url, urls));
    return medias.map(media => ({ url: media.url, description: media.description }));
}