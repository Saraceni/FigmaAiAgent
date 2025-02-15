import { generateId } from 'ai';
import { index, pgTable, text, timestamp, varchar, vector, integer } from 'drizzle-orm/pg-core';
import { resources } from './resources';
import { createSelectSchema } from 'drizzle-zod';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

export const media = pgTable(
    'media',
    {
        id: varchar('id', { length: 191 })
            .primaryKey()
            .$defaultFn(() => generateId()),
        resourceId: varchar('resource_id', { length: 191 }).references(
            () => resources.id,
            { onDelete: 'cascade' },
        ),
        url: text('url').notNull(),
        mimeType: text('mime_type').notNull(),
        description: text('description').notNull(),
        createdAt: timestamp("created_at")
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp("updated_at")
            .notNull()
            .default(sql`now()`),
    },
);

// Schema for media - used to validate API requests
export const insertMediaSchema = createSelectSchema(media)
    .extend({})
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    });

// Type for media - used to type API request params and within Components
export type NewMediaParams = z.infer<typeof insertMediaSchema>;