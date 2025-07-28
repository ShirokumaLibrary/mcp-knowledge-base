/**
 * @ai-context MCP tool schema definitions for external API
 * @ai-pattern Declarative tool specifications following MCP protocol
 * @ai-critical This defines the external API contract - changes break clients
 * @ai-why Centralized definitions ensure consistency across all tool types
 * @ai-assumption JSON Schema format as required by MCP specification
 */
export declare const toolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type: {
                type: string;
                description: string;
            };
            includeClosedStatuses: {
                type: string;
                description: string;
            };
            statuses: {
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
            limit: {
                type: string;
                description: string;
            };
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
            query?: undefined;
            offset?: undefined;
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
                description: string;
            };
            id: {
                type: string;
                description: string;
            };
            includeClosedStatuses?: undefined;
            statuses?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            limit?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
            query?: undefined;
            offset?: undefined;
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
            status: {
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
            related_tasks: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            related_documents: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            datetime: {
                type: string;
                description: string;
            };
            date: {
                type: string;
                description: string;
            };
            id: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            includeClosedStatuses?: undefined;
            statuses?: undefined;
            limit?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
            query?: undefined;
            offset?: undefined;
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
            status: {
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
            related_tasks: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            related_documents: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            includeClosedStatuses?: undefined;
            statuses?: undefined;
            limit?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
            query?: undefined;
            offset?: undefined;
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
                };
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statuses?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            limit?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            name?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
            query?: undefined;
            offset?: undefined;
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
            statuses?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            limit?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
            query?: undefined;
            offset?: undefined;
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
            statuses?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            limit?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            types?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
            query?: undefined;
            offset?: undefined;
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
            statuses?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            limit?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
            query?: undefined;
            offset?: undefined;
        };
        required: string[];
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
            base_type: {
                type: string;
                enum: string[];
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statuses?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            limit?: undefined;
            id?: undefined;
            title?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            types?: undefined;
            pattern?: undefined;
            include_definitions?: undefined;
            query?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            include_definitions: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statuses?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            limit?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            types?: undefined;
            name?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            query?: undefined;
            offset?: undefined;
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
            description: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statuses?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            limit?: undefined;
            id?: undefined;
            title?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            types?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
            query?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            types: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statuses?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            name?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            types: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            type?: undefined;
            includeClosedStatuses?: undefined;
            statuses?: undefined;
            start_date?: undefined;
            end_date?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            content?: undefined;
            priority?: undefined;
            status?: undefined;
            tags?: undefined;
            related_tasks?: undefined;
            related_documents?: undefined;
            datetime?: undefined;
            date?: undefined;
            category?: undefined;
            tag?: undefined;
            name?: undefined;
            pattern?: undefined;
            base_type?: undefined;
            include_definitions?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
})[];
