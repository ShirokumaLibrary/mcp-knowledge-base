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
    description: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    base_type: "tasks" | "documents";
    name: string;
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
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
/**
 * @ai-intent Schema for update_type tool
 * @ai-validation Only description can be updated, type name changes prohibited
 */
export declare const UpdateTypeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
}, "strict", z.ZodTypeAny, {
    description: string;
    name: string;
}, {
    description: string;
    name: string;
}>;
export type CreateTypeArgs = z.infer<typeof CreateTypeSchema>;
export type GetTypesArgs = z.infer<typeof GetTypesSchema>;
export type DeleteTypeArgs = z.infer<typeof DeleteTypeSchema>;
export type UpdateTypeArgs = z.infer<typeof UpdateTypeSchema>;
