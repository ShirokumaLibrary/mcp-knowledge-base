/**
 * @ai-context Common handler patterns
 * @ai-pattern Reusable handler logic
 * @ai-critical Ensures consistent behavior across handlers
 * @ai-why Eliminates duplicate code in handlers
 * @ai-assumption All handlers follow similar patterns
 */
import { z } from 'zod';
/**
 * @ai-intent Common handler response patterns
 * @ai-pattern Standardized response formatting
 */
export class HandlerPatterns {
    /**
     * @ai-intent Create standard CRUD handlers
     * @ai-pattern Factory for common operations
     */
    static createCrudHandlers(handler, entityName, operations, schemas, formatters) {
        return {
            /**
             * @ai-intent Handle list operation
             * @ai-pattern Standard list response
             */
            handleList: handler.wrapHandler(`list ${entityName}s`, z.object({}), async () => {
                handler.ensureDatabase();
                const items = await operations.getAll();
                if (items.length === 0) {
                    return handler.createResponse(`## ${entityName}s\n\nNo ${entityName.toLowerCase()}s found.`);
                }
                if (formatters?.list) {
                    return handler.createResponse(formatters.list(items));
                }
                // @ai-logic: Default list format
                const markdown = [
                    `## ${entityName}s`,
                    '',
                    `Found ${items.length} ${entityName.toLowerCase()}${items.length === 1 ? '' : 's'}:`,
                    '',
                    ...items.map(item => `- **${item.title}** (ID: ${item.id})`)
                ].join('\n');
                return handler.createResponse(markdown);
            }),
            /**
             * @ai-intent Handle get by ID operation
             * @ai-pattern Standard detail response
             */
            handleGetById: handler.wrapHandler(`get ${entityName}`, z.object({ id: z.union([z.string(), z.number()]) }), async (args) => {
                handler.ensureDatabase();
                const item = await operations.getById(args.id);
                if (!item) {
                    return handler.createErrorResponse(`${entityName} with ID ${args.id} not found`);
                }
                if (formatters?.detail) {
                    return handler.createResponse(formatters.detail(item));
                }
                return handler.createResponse(handler.formatJson(item));
            }),
            /**
             * @ai-intent Handle create operation
             * @ai-pattern Standard creation response
             */
            handleCreate: handler.wrapHandler(`create ${entityName}`, schemas.create, async (args) => {
                handler.ensureDatabase();
                const created = await operations.create(args);
                return handler.createResponse(`## ${entityName} Created\n\n` +
                    `Successfully created ${entityName.toLowerCase()} "${created.title}" with ID ${created.id}`);
            }),
            /**
             * @ai-intent Handle update operation
             * @ai-pattern Standard update response
             */
            handleUpdate: handler.wrapHandler(`update ${entityName}`, schemas.update, async (args) => {
                handler.ensureDatabase();
                const updated = await operations.update(args.id, args);
                if (!updated) {
                    return handler.createErrorResponse(`${entityName} with ID ${args.id} not found`);
                }
                return handler.createResponse(`## ${entityName} Updated\n\n` +
                    `Successfully updated ${entityName.toLowerCase()} "${updated.title}"`);
            }),
            /**
             * @ai-intent Handle delete operation
             * @ai-pattern Standard deletion response
             */
            handleDelete: handler.wrapHandler(`delete ${entityName}`, schemas.delete, async (args) => {
                handler.ensureDatabase();
                const deleted = await operations.delete(args.id);
                if (!deleted) {
                    return handler.createErrorResponse(`${entityName} with ID ${args.id} not found or cannot be deleted`);
                }
                return handler.createResponse(`## ${entityName} Deleted\n\n` +
                    `Successfully deleted ${entityName.toLowerCase()} with ID ${args.id}`);
            })
        };
    }
    /**
     * @ai-intent Create search handler
     * @ai-pattern Standard search operation
     */
    static createSearchHandler(handler, entityName, searchOperation, schema, formatter) {
        return handler.wrapHandler(`search ${entityName}s`, schema, async (args) => {
            handler.ensureDatabase();
            const results = await searchOperation(args.query, args);
            if (results.length === 0) {
                return handler.createResponse(`## Search Results\n\nNo ${entityName.toLowerCase()}s found matching your search.`);
            }
            if (formatter) {
                return handler.createResponse(formatter(results));
            }
            // @ai-logic: Default search results format
            const markdown = [
                '## Search Results',
                '',
                `Found ${results.length} ${entityName.toLowerCase()}${results.length === 1 ? '' : 's'}:`,
                '',
                ...results.map(item => `- **${item.title}** (ID: ${item.id})`)
            ].join('\n');
            return handler.createResponse(markdown);
        });
    }
    /**
     * @ai-intent Create tag-based search handler
     * @ai-pattern Standard tag search
     */
    static createTagSearchHandler(handler, entityName, searchByTag, formatter) {
        return handler.wrapHandler(`search ${entityName}s by tag`, z.object({ tag: z.string() }), async (args) => {
            handler.ensureDatabase();
            const results = await searchByTag(args.tag);
            if (results.length === 0) {
                return handler.createResponse(`## ${entityName}s with tag "${args.tag}"\n\n` +
                    `No ${entityName.toLowerCase()}s found with this tag.`);
            }
            return handler.createResponse(formatter(results));
        });
    }
    /**
     * @ai-intent Create batch operation handler
     * @ai-pattern Standard batch processing
     */
    static createBatchHandler(handler, operationName, batchOperation, schema, formatter) {
        return handler.wrapHandler(operationName, schema, async (args) => {
            handler.ensureDatabase();
            if (!args.items || args.items.length === 0) {
                return handler.createErrorResponse('No items provided for batch operation');
            }
            const results = await batchOperation(args.items);
            return handler.createResponse(formatter(results));
        });
    }
    /**
     * @ai-intent Create date range handler
     * @ai-pattern Standard date filtering
     */
    static createDateRangeHandler(handler, entityName, operation, formatter) {
        return handler.wrapHandler(`get ${entityName}s by date`, z.object({
            start_date: z.string().optional(),
            end_date: z.string().optional()
        }).refine(data => {
            if (data.start_date && data.end_date) {
                return new Date(data.start_date) <= new Date(data.end_date);
            }
            return true;
        }, { message: 'Start date must be before end date' }), async (args) => {
            handler.ensureDatabase();
            const items = await operation(args.start_date, args.end_date);
            if (items.length === 0) {
                const dateRange = this.formatDateRange(args.start_date, args.end_date);
                return handler.createResponse(`## ${entityName}s ${dateRange}\n\n` +
                    `No ${entityName.toLowerCase()}s found in this date range.`);
            }
            return handler.createResponse(formatter(items));
        });
    }
    /**
     * @ai-intent Format date range for display
     * @ai-pattern Consistent date range formatting
     */
    static formatDateRange(startDate, endDate) {
        if (startDate && endDate) {
            return `from ${startDate} to ${endDate}`;
        }
        else if (startDate) {
            return `from ${startDate}`;
        }
        else if (endDate) {
            return `until ${endDate}`;
        }
        else {
            return '';
        }
    }
}
/**
 * @ai-intent Response formatting helpers
 * @ai-pattern Common response formats
 */
export class ResponsePatterns {
    /**
     * @ai-intent Format item list as markdown table
     * @ai-pattern Table format for structured data
     */
    static formatAsTable(items, columns, title) {
        const lines = [];
        if (title) {
            lines.push(`## ${title}`, '');
        }
        // @ai-logic: Build header row
        const headers = columns.map(col => col.header);
        lines.push(`| ${headers.join(' | ')} |`);
        // @ai-logic: Build separator row
        const separators = columns.map(() => '---');
        lines.push(`| ${separators.join(' | ')} |`);
        // @ai-logic: Build data rows
        for (const item of items) {
            const values = columns.map(col => {
                const value = item[col.key];
                return col.formatter ? col.formatter(value) : String(value ?? '');
            });
            lines.push(`| ${values.join(' | ')} |`);
        }
        return lines.join('\n');
    }
    /**
     * @ai-intent Format items as grouped list
     * @ai-pattern Group items by a field
     */
    static formatGroupedList(items, groupBy, itemFormatter, title) {
        const groups = new Map();
        // @ai-logic: Group items
        for (const item of items) {
            const key = item[groupBy];
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(item);
        }
        const lines = [];
        if (title) {
            lines.push(`## ${title}`, '');
        }
        // @ai-logic: Format each group
        for (const [groupKey, groupItems] of groups) {
            lines.push(`### ${groupKey}`, '');
            lines.push(...groupItems.map(itemFormatter));
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * @ai-intent Format summary statistics
     * @ai-pattern Statistics display format
     */
    static formatStats(stats, title = 'Statistics') {
        const lines = [
            `## ${title}`,
            '',
            ...Object.entries(stats).map(([key, value]) => `- **${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:** ${value}`)
        ];
        return lines.join('\n');
    }
}
//# sourceMappingURL=handler-patterns.js.map