export class CreateItemHandler {
    useCase;
    constructor(useCase) {
        this.useCase = useCase;
    }
    async handle(request) {
        try {
            const args = request.params.arguments;
            let related = args.related || [];
            if (args.related_tasks || args.related_documents) {
                const tasks = args.related_tasks || [];
                const docs = args.related_documents || [];
                related = [...new Set([...related, ...tasks, ...docs])];
                delete args.related_tasks;
                delete args.related_documents;
            }
            const input = {
                ...args,
                related,
            };
            const result = await this.useCase.execute(input);
            const response = {
                id: result.id,
                type: result.type,
                title: result.title,
                related: result.related,
            };
            if (result.related.length > 0) {
                response.related_tasks = result.related.filter(id => {
                    const [type] = id.split('-');
                    return ['issues', 'plans', 'bugs', 'features'].includes(type);
                });
                response.related_documents = result.related.filter(id => {
                    const [type] = id.split('-');
                    return ['docs', 'knowledge', 'sessions', 'dailies'].includes(type);
                });
            }
            else {
                response.related_tasks = [];
                response.related_documents = [];
            }
            const createdItem = {
                ...response,
                description: args.description,
                content: args.content,
                tags: args.tags || [],
                priority: args.priority,
                status: args.status,
                start_date: args.startDate || args.start_date,
                end_date: args.endDate || args.end_date,
                version: args.version,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            Object.keys(createdItem).forEach(key => {
                if (createdItem[key] === undefined) {
                    delete createdItem[key];
                }
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: createdItem }, null, 2),
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
