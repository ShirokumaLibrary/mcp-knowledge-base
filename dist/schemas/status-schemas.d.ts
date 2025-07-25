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
export declare const CreateStatusSchema: z.ZodObject<{
    name: z.ZodString;
    is_closed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    is_closed: boolean;
}, {
    name: string;
    is_closed?: boolean | undefined;
}>;
/**
 * @ai-intent Schema for update_status tool
 * @ai-validation ID and new name both required
 * @ai-critical Cannot update if status in use
 * @ai-return Updated status or error
 */
export declare const UpdateStatusSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    is_closed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: number;
    name: string;
    is_closed?: boolean | undefined;
}, {
    id: number;
    name: string;
    is_closed?: boolean | undefined;
}>;
/**
 * @ai-intent Schema for delete_status tool
 * @ai-validation Positive integer ID required
 * @ai-critical Fails if status referenced by items
 * @ai-return Boolean success indicator
 */
export declare const DeleteStatusSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
