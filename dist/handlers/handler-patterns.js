import { z } from 'zod';
export class HandlerPatterns {
    static createCrudHandlers(handler, entityName, operations, schemas, formatters) {
        return {
            handleList: handler.wrapHandler(`list ${entityName}s`, z.object({}), async () => {
                handler.ensureDatabase();
                const items = await operations.getAll();
                if (items.length === 0) {
                    return handler.createResponse(`## ${entityName}s\n\nNo ${entityName.toLowerCase()}s found.`);
                }
                if (formatters?.list) {
                    return handler.createResponse(formatters.list(items));
                }
                const markdown = [
                    `## ${entityName}s`,
                    '',
                    `Found ${items.length} ${entityName.toLowerCase()}${items.length === 1 ? '' : 's'}:`,
                    '',
                    ...items.map(item => `- **${item.title}** (ID: ${item.id})`)
                ].join('\n');
                return handler.createResponse(markdown);
            }),
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
            handleCreate: handler.wrapHandler(`create ${entityName}`, schemas.create, async (args) => {
                handler.ensureDatabase();
                const created = await operations.create(args);
                return handler.createResponse(`## ${entityName} Created\n\n` +
                    `Successfully created ${entityName.toLowerCase()} "${created.title}" with ID ${created.id}`);
            }),
            handleUpdate: handler.wrapHandler(`update ${entityName}`, schemas.update, async (args) => {
                handler.ensureDatabase();
                const updated = await operations.update(args.id, args);
                if (!updated) {
                    return handler.createErrorResponse(`${entityName} with ID ${args.id} not found`);
                }
                return handler.createResponse(`## ${entityName} Updated\n\n` +
                    `Successfully updated ${entityName.toLowerCase()} "${updated.title}"`);
            }),
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
export class ResponsePatterns {
    static formatAsTable(items, columns, title) {
        const lines = [];
        if (title) {
            lines.push(`## ${title}`, '');
        }
        const headers = columns.map(col => col.header);
        lines.push(`| ${headers.join(' | ')} |`);
        const separators = columns.map(() => '---');
        lines.push(`| ${separators.join(' | ')} |`);
        for (const item of items) {
            const values = columns.map(col => {
                const value = item[col.key];
                return col.formatter ? col.formatter(value) : String(value ?? '');
            });
            lines.push(`| ${values.join(' | ')} |`);
        }
        return lines.join('\n');
    }
    static formatGroupedList(items, groupBy, itemFormatter, title) {
        const groups = new Map();
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
        for (const [groupKey, groupItems] of groups) {
            lines.push(`### ${groupKey}`, '');
            lines.push(...groupItems.map(itemFormatter));
            lines.push('');
        }
        return lines.join('\n');
    }
    static formatStats(stats, title = 'Statistics') {
        const lines = [
            `## ${title}`,
            '',
            ...Object.entries(stats).map(([key, value]) => `- **${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:** ${value}`)
        ];
        return lines.join('\n');
    }
}
