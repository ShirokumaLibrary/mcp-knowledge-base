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
}, "strict", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
/**
 * @ai-intent Schema for get_types tool
 */
export declare const GetTypesSchema: z.ZodObject<{
    include_built_in: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    include_definitions: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    include_built_in: boolean;
    include_definitions: boolean;
}, {
    include_built_in?: boolean | undefined;
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
