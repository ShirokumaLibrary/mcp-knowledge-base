/**
 * @ai-context Zod schemas for workflow status management
 * @ai-pattern Status CRUD operations validation
 * @ai-critical Statuses are referenced by issues and plans
 * @ai-assumption Status names should be unique
 * @ai-why Workflow states are fundamental to task tracking
 */
import { z } from 'zod';
/**
 * @ai-intent Schema for create_status tool
 * @ai-validation Name required and non-empty
 * @ai-side-effects Creates status in SQLite only
 * @ai-return New status with generated ID
 */
export const CreateStatusSchema = z.object({
    name: z.string().min(1, 'Status name is required'), // @ai-validation: Non-empty
    is_closed: z.boolean().optional().default(false), // @ai-default: false for new statuses
});
/**
 * @ai-intent Schema for update_status tool
 * @ai-validation ID and new name both required
 * @ai-critical Cannot update if status in use
 * @ai-return Updated status or error
 */
export const UpdateStatusSchema = z.object({
    id: z.number().int().positive(), // @ai-validation: Must be > 0
    name: z.string().min(1, 'Status name is required'),
    is_closed: z.boolean().optional(), // @ai-logic: Optional to allow partial updates
});
/**
 * @ai-intent Schema for delete_status tool
 * @ai-validation Positive integer ID required
 * @ai-critical Fails if status referenced by items
 * @ai-return Boolean success indicator
 */
export const DeleteStatusSchema = z.object({
    id: z.number().int().positive(), // @ai-validation: Must exist
});
//# sourceMappingURL=status-schemas.js.map