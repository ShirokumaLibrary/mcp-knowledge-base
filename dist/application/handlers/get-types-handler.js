export class GetTypesHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(_request) {
        try {
            const types = await this.repository.getAllTypes();
            const grouped = {
                tasks: [],
                documents: [],
            };
            for (const type of types) {
                grouped[type.baseType].push({
                    name: type.name,
                    description: type.description || `${type.name} items`,
                });
            }
            const response = {
                tasks: {
                    description: 'Items with status and priority tracking',
                    types: grouped.tasks,
                },
                documents: {
                    description: 'Documentation and content items',
                    types: grouped.documents,
                },
            };
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(response, null, 2),
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
