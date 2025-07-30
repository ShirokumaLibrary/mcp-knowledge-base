import { z } from 'zod';
export const ChangeItemTypeSchema = z.object({
    from_type: z.string().describe('Current type of the item'),
    from_id: z.number().positive().describe('Current ID of the item'),
    to_type: z.string().describe('New type (must have same base_type as from_type)')
});
