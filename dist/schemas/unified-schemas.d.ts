/**
 * @ai-context Unified schemas for all item operations
 * @ai-pattern Zod schemas for request validation
 * @ai-critical Single source of truth for API contracts
 */
import { z } from 'zod';
/**
 * @ai-intent Get items parameters
 * @ai-validation Type required, optional status filtering
 */
export declare const GetItemsParams: z.ZodObject<{
    type: z.ZodString;
    statuses: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeClosedStatuses: z.ZodOptional<z.ZodBoolean>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: string;
    start_date?: string | undefined;
    end_date?: string | undefined;
    statuses?: string[] | undefined;
    includeClosedStatuses?: boolean | undefined;
    limit?: number | undefined;
}, {
    type: string;
    start_date?: string | undefined;
    end_date?: string | undefined;
    statuses?: string[] | undefined;
    includeClosedStatuses?: boolean | undefined;
    limit?: number | undefined;
}>;
/**
 * @ai-intent Get item detail parameters
 * @ai-validation Type and ID required
 */
export declare const GetItemDetailParams: z.ZodObject<{
    type: z.ZodString;
    id: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
}, "strip", z.ZodTypeAny, {
    id: string | number;
    type: string;
}, {
    id: string | number;
    type: string;
}>;
/**
 * @ai-intent Create item parameters
 * @ai-validation Type and title required, other fields optional
 */
export declare const CreateItemParams: z.ZodObject<{
    type: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
    status: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    start_time: z.ZodOptional<z.ZodString>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    datetime: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    type: string;
    id?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    date?: string | undefined;
    content?: string | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    status?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    related_tasks?: string[] | undefined;
    related?: string[] | undefined;
    related_documents?: string[] | undefined;
    start_time?: string | undefined;
    category?: string | undefined;
    datetime?: string | undefined;
}, {
    title: string;
    type: string;
    id?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    date?: string | undefined;
    content?: string | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    status?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    related_tasks?: string[] | undefined;
    related?: string[] | undefined;
    related_documents?: string[] | undefined;
    start_time?: string | undefined;
    category?: string | undefined;
    datetime?: string | undefined;
}>;
/**
 * @ai-intent Update item parameters
 * @ai-validation Type and ID required, all fields optional
 */
export declare const UpdateItemParams: z.ZodObject<{
    type: z.ZodString;
    id: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
    status: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    start_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    end_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    start_time: z.ZodOptional<z.ZodString>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string | number;
    type: string;
    title?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    status?: string | undefined;
    start_date?: string | null | undefined;
    end_date?: string | null | undefined;
    related_tasks?: string[] | undefined;
    related?: string[] | undefined;
    related_documents?: string[] | undefined;
    start_time?: string | undefined;
}, {
    id: string | number;
    type: string;
    title?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    status?: string | undefined;
    start_date?: string | null | undefined;
    end_date?: string | null | undefined;
    related_tasks?: string[] | undefined;
    related?: string[] | undefined;
    related_documents?: string[] | undefined;
    start_time?: string | undefined;
}>;
/**
 * @ai-intent Delete item parameters
 * @ai-validation Type and ID required
 */
export declare const DeleteItemParams: z.ZodObject<{
    type: z.ZodString;
    id: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
}, "strip", z.ZodTypeAny, {
    id: string | number;
    type: string;
}, {
    id: string | number;
    type: string;
}>;
/**
 * @ai-intent Search items by tag parameters
 * @ai-validation Tag required, types optional
 */
export declare const SearchItemsByTagParams: z.ZodObject<{
    tag: z.ZodString;
    types: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    tag: string;
    types?: string[] | undefined;
}, {
    tag: string;
    types?: string[] | undefined;
}>;
/**
 * @ai-intent Session operation schemas
 */
export declare const GetSessionsParams: z.ZodObject<{
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
export declare const GetSessionDetailParams: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const GetLatestSessionParams: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const CreateSessionParams: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    datetime: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    id?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
    category?: string | undefined;
    datetime?: string | undefined;
}, {
    title: string;
    id?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
    category?: string | undefined;
    datetime?: string | undefined;
}>;
export declare const UpdateSessionParams: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
    category?: string | undefined;
}, {
    id: string;
    title?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
    category?: string | undefined;
}>;
export declare const SearchSessionsByTagParams: z.ZodObject<{
    tag: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tag: string;
}, {
    tag: string;
}>;
/**
 * @ai-intent Summary operation schemas
 */
export declare const GetSummariesParams: z.ZodObject<{
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
export declare const GetSummaryDetailParams: z.ZodObject<{
    date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    date: string;
}, {
    date: string;
}>;
export declare const CreateSummaryParams: z.ZodObject<{
    date: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    date: string;
    content: string;
    tags?: string[] | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
}, {
    title: string;
    date: string;
    content: string;
    tags?: string[] | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
}>;
export declare const UpdateSummaryParams: z.ZodObject<{
    date: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    date: string;
    title?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
}, {
    date: string;
    title?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
}>;
