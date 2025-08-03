export class GetItemsHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(request) {
        try {
            const args = request.params.arguments;
            const { type, limit, start_date, end_date, statuses, includeClosedStatuses } = args;
            if (!type) {
                throw new Error('Type is required');
            }
            let items;
            const types = await this.repository.getAllTypes();
            const typeInfo = types.find(t => t.name === type);
            if (!typeInfo) {
                throw new Error(`Invalid type: ${type}`);
            }
            if (typeInfo.baseType === 'tasks') {
                items = await this.repository.findTasks({
                    statuses,
                    includeClosedStatuses,
                    startDate: start_date,
                    endDate: end_date,
                    limit,
                });
                items = items.filter(item => item.type === type);
            }
            else {
                items = await this.repository.findByType(type, { limit });
                if (start_date || end_date) {
                    items = items.filter(item => {
                        const itemDate = item.type === 'dailies' || item.type === 'sessions'
                            ? item.id.id
                            : item.updatedAt.toISOString().split('T')[0];
                        if (start_date && itemDate < start_date)
                            return false;
                        if (end_date && itemDate > end_date)
                            return false;
                        return true;
                    });
                }
            }
            const formattedItems = items.map(item => {
                const baseItem = {
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
                    baseItem.related_tasks = item.related.getTasks();
                    baseItem.related_documents = item.related.getDocuments();
                }
                else {
                    baseItem.related_tasks = [];
                    baseItem.related_documents = [];
                }
                if ('status' in item) {
                    baseItem.status = item.status;
                    baseItem.priority = item.priority;
                    baseItem.start_date = item.startDate;
                    baseItem.end_date = item.endDate;
                    baseItem.status_id = this.getStatusId(item.status);
                }
                if ('version' in item) {
                    baseItem.version = item.version;
                }
                Object.keys(baseItem).forEach(key => {
                    if (baseItem[key] === undefined) {
                        delete baseItem[key];
                    }
                });
                return baseItem;
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: formattedItems }, null, 2),
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
