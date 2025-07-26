/**
 * @ai-context Zod schemas for type management operations
 * @ai-pattern Validation schemas for dynamic type system
 */
import { z } from 'zod';
/**
 * @ai-intent Schema for create_type tool
 */
export declare const CreateTypeSchema: z.ZodObject<{
    name: z.ZodString;
    base_type: z.ZodDefault<z.ZodOptional<z.ZodEnum<["tasks", "documents"]>>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    base_type: "tasks" | "documents";
}, {
    name: string;
    base_type?: "tasks" | "documents" | undefined;
}>;
/**
 * @ai-intent Schema for get_types tool
 */
export declare const GetTypesSchema: z.ZodObject<{
    include_definitions: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    include_definitions: boolean;
}, {
    include_definitions?: boolean | undefined;
}>;
/**
 * @ai-intent Schema for delete_type tool
 */
export declare const DeleteTypeSchema: z.ZodObject<{
    name: z.ZodString;
}, "strict", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type CreateTypeArgs = z.infer<typeof CreateTypeSchema>;
export type GetTypesArgs = z.infer<typeof GetTypesSchema>;
export type DeleteTypeArgs = z.infer<typeof DeleteTypeSchema>;
