export const ResponseFormatters = {
    formatDataResponse(data, message) {
        const response = { data };
        if (message) {
            response.message = message;
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(response, null, 2)
                }]
        };
    },
    formatSuccessResponse(message) {
        return {
            content: [{
                    type: 'text',
                    text: message
                }]
        };
    },
    formatMarkdownResponse(markdown) {
        return {
            content: [{
                    type: 'text',
                    text: markdown
                }]
        };
    },
    formatErrorResponse(code, message, data) {
        return {
            error: {
                code,
                message,
                data
            }
        };
    }
};
export const ApiTypeGuards = {
    isToolResponse(value) {
        return (typeof value === 'object' &&
            value !== null &&
            'content' in value &&
            Array.isArray(value.content));
    },
    isErrorResponse(value) {
        return (typeof value === 'object' &&
            value !== null &&
            'error' in value &&
            typeof value.error === 'object');
    },
    isDataResponse(value) {
        return (typeof value === 'object' &&
            value !== null &&
            'data' in value);
    }
};
