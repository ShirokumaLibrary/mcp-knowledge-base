/**
 * @ai-context MCP tool schema definitions for external API
 * @ai-pattern Declarative tool specifications following MCP protocol
 * @ai-critical This defines the external API contract - changes break clients
 * @ai-why Unified definitions ensure consistency across all tool types
 * @ai-assumption JSON Schema format as required by MCP specification
 */
export declare const unifiedToolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            includeClosedStatuses: {
                type: string;
                description: string;
            };
            statusIds: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status_id?: undefined;
            tags?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            id: {
                type: string;
                description: string;
            };
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status_id?: undefined;
            tags?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            priority: {
                type: string;
                enum: string[];
                description: string;
            };
            status_id: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            start_date: {
                type: string;
                description: string;
            };
            end_date: {
                type: string;
                description: string;
            };
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            id?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            id: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            priority: {
                type: string;
                enum: string[];
                description: string;
            };
            status_id: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            start_date: {
                type: string;
                description: string;
            };
            end_date: {
                type: string;
                description: string;
            };
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            tag: {
                type: string;
                description: string;
            };
            types: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status_id?: undefined;
            tags?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type?: undefined;
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status_id?: undefined;
            tags?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            name: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status_id?: undefined;
            tags?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            tag?: undefined;
            types?: undefined;
            pattern?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            pattern: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status_id?: undefined;
            tags?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            start_date: {
                type: string;
                description: string;
            };
            end_date: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status_id?: undefined;
            tags?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status_id?: undefined;
            tags?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            priority?: undefined;
            status_id?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            date?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            tag: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status_id?: undefined;
            tags?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
            date?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            date: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status_id?: undefined;
            tags?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            date: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statusIds?: undefined;
            id?: undefined;
            description?: undefined;
            priority?: undefined;
            status_id?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            category?: undefined;
        };
        required: string[];
    };
})[];
