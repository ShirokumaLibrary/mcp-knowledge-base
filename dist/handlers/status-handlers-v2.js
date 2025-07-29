import { BaseHandler } from './base-handler.js';
import { CreateStatusSchema, UpdateStatusSchema, DeleteStatusSchema } from '../schemas/status-schemas.js';
import { z } from 'zod';
const EmptySchema = z.object({});
export class StatusHandlersV2 extends BaseHandler {
    constructor(database) {
        super('StatusHandlers', database);
    }
    async initialize() {
    }
    handleGetStatuses = this.wrapHandler('get statuses', EmptySchema, async () => {
        this.ensureDatabase();
        const statuses = await this.database.getAllStatuses();
        if (statuses.length === 0) {
            return this.createResponse('## Statuses\n\nNo statuses found. Please create statuses first.');
        }
        const markdown = [
            '## Available Statuses',
            '',
            '| Name | Is Closed |',
            '|------|-----------|',
            ...statuses.map((status) => `| ${status.name} | ${status.is_closed ? 'Yes' : 'No'} |`)
        ].join('\n');
        return this.createResponse(markdown);
    });
    handleCreateStatus = this.wrapHandler('create status', CreateStatusSchema, async (args) => {
        this.ensureDatabase();
        const newStatus = await this.database.createStatus(args.name, args.is_closed || false);
        return this.createResponse(`## Status Created\n\n${this.formatJson(newStatus)}`);
    });
    handleUpdateStatus = this.wrapHandler('update status', UpdateStatusSchema, async (args) => {
        this.ensureDatabase();
        const updated = await this.database.updateStatus(args.id, args.name, args.is_closed);
        if (!updated) {
            return this.createErrorResponse(`Status with ID ${args.id} not found`);
        }
        return this.createResponse(`## Status Updated\n\nStatus ID ${args.id} has been updated to "${args.name}"`);
    });
    handleDeleteStatus = this.wrapHandler('delete status', DeleteStatusSchema, async (args) => {
        this.ensureDatabase();
        const deleted = await this.database.deleteStatus(args.id);
        if (!deleted) {
            return this.createErrorResponse(`Status with ID ${args.id} not found or is in use by existing items`);
        }
        return this.createResponse(`## Status Deleted\n\nStatus ID ${args.id} has been successfully deleted`);
    });
}
