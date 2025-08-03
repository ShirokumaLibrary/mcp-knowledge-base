export class GetCurrentStateHandler {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    async handle(_request) {
        try {
            const state = await this.storage.get();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(state, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : 'Unknown error'
                        }, null, 2),
                    },
                ],
            };
        }
    }
}
export class UpdateCurrentStateHandler {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    async handle(request) {
        try {
            const args = request.params.arguments;
            const { content, tags, related, updated_by } = args;
            if (!content) {
                throw new Error('Content is required');
            }
            await this.storage.update(content, {
                tags: tags || [],
                related: related || [],
                updated_by: updated_by || 'unknown',
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Current state updated successfully',
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : 'Unknown error'
                        }, null, 2),
                    },
                ],
            };
        }
    }
}
