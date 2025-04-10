import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { chat } from './chat';
import { z } from 'zod';

// Define the component output schema with chat reference
export const componentOutputs = pgTable('component_outputs', {
    id: uuid('id').defaultRandom().primaryKey(),
    chatId: text('chat_id').notNull().references(() => chat.id),
    html: text('html').notNull(),
    css: text('css').notNull(),
    stylingNotes: text('styling_notes'),
    colorDetails: text('color_details'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define the relation between chat and component outputs
export const componentOutputsRelations = relations(componentOutputs, ({ one }) => ({
    chat: one(chat, {
        fields: [componentOutputs.chatId],
        references: [chat.id],
    }),
}));

export const chatRelations = relations(chat, ({ many }) => ({
    componentOutputs: many(componentOutputs),
}));

// ComponentOutput schema for validation
export const ComponentOutputSchema = z.object({
    html: z.string(),
    css: z.string(),
    stylingNotes: z.string().optional(),
    colorDetails: z.record(z.string(), z.any()).optional(),
    chatId: z.string(),
});

export type ComponentOutput = z.infer<typeof ComponentOutputSchema>;