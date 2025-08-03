export class GetStatusesHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(_request) {
        try {
            const statuses = await this.repository.getAllStatuses();
            const statusData = statuses.map(name => ({
                name,
                id: this.getStatusId(name),
                is_closed: ['Closed', 'Done'].includes(name),
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: statusData }, null, 2),
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
        return statusMap[status] || 0;
    }
}
