import { ItemId } from '../../core/entities/value-objects/item-id.js';
export class GetItemDetailHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(request) {
        try {
            const args = request.params.arguments;
            const { type, id } = args;
            if (!type || !id) {
                throw new Error('Type and ID are required');
            }
            const itemId = new ItemId(type, id.toString());
            const item = await this.repository.findById(itemId);
            if (!item) {
                throw new Error(`Item not found: ${itemId.toString()}`);
            }
            const formattedItem = {
                id: item.id.toString(),
                type: item.type,
                title: item.title,
                description: item.description,
                content: item.content,
                tags: item.tags,
                related: item.related.toArray(),
                created_at: item.createdAt.toISOString(),
                updated_at: item.updatedAt.toISOString(),
            };
            if (item.related.size > 0) {
                formattedItem.related_tasks = item.related.getTasks();
                formattedItem.related_documents = item.related.getDocuments();
            }
            else {
                formattedItem.related_tasks = [];
                formattedItem.related_documents = [];
            }
            if ('status' in item) {
                formattedItem.status = item.status;
                formattedItem.priority = item.priority;
                formattedItem.start_date = item.startDate;
                formattedItem.end_date = item.endDate;
                formattedItem.status_id = this.getStatusId(item.status);
            }
            if ('version' in item) {
                formattedItem.version = item.version;
            }
            if (type === 'dailies') {
                formattedItem.date = id;
            }
            Object.keys(formattedItem).forEach(key => {
                if (formattedItem[key] === undefined) {
                    delete formattedItem[key];
                }
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: formattedItem }, null, 2),
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
    getStatusId(status) {
        const statusMap = {
            'Open': 1,
            'In Progress': 2,
            'Closed': 3,
            'Done': 4,
            'On Hold': 5,
        };
        return statusMap[status] || 1;
    }
}
