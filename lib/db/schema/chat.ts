import { generateId } from 'ai';
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const chat = pgTable(
    'chat',
    {
        id: varchar('id', { length: 191 })
            .primaryKey()
            .$defaultFn(() => generateId()),
        sessionId: varchar('session_id', { length: 191 }).notNull(),
        response: text('response').notNull(),
        modelId: text('model_id').notNull(),
        question: text('question').notNull(),
        createdAt: timestamp("created_at")
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp("updated_at")
            .notNull()
            .default(sql`now()`),
    },
);

// Schema for chat - used to validate API requests
export const insertChatSchema = createSelectSchema(chat)
    .extend({})
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    });

// Type for chat - used to type API request params and within Components
export type NewChatParams = z.infer<typeof insertChatSchema>;