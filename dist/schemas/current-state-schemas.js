import { z } from 'zod';
export const UpdateCurrentStateSchema = z.object({
    content: z.string().describe('New state content')
});
