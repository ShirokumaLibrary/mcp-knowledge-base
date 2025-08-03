export class GetTagsHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(_request) {
        try {
            const tags = await this.repository.getAllTags();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: tags }, null, 2),
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
