import { z } from 'zod';
export const UpdateCurrentStateSchema = z.object({
    content: z.string().describe('New state content'),
    related: z.array(z.string()).optional().describe('Related item IDs (sessions, dailies, issues, docs, etc.)'),
    tags: z.array(z.string()).optional().describe('Tags for categorization'),
    updated_by: z.string().optional().describe('Who/what updated the state (e.g., ai-start, ai-finish)')
});
export const CurrentStateMetadataSchema = z.object({
    title: z.string().default('プロジェクト現在状態'),
    type: z.literal('current_state').default('current_state'),
    priority: z.enum(['high', 'medium', 'low']).default('high'),
    tags: z.array(z.string()).default(['system', 'state']),
    related: z.array(z.string()).default([]),
    updated_at: z.string().optional(),
    updated_by: z.string().optional()
});
