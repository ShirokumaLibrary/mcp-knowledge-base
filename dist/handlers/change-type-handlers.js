import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ChangeItemTypeSchema } from '../schemas/change-type-schemas.js';
import { createLogger } from '../utils/logger.js';
export class ChangeTypeHandlers {
    db;
    logger = createLogger('ChangeTypeHandlers');
    handlerName = 'ChangeTypeHandlers';
    constructor(db) {
        this.db = db;
    }
    async handleChangeItemType(args) {
        this.logger.info('Changing item type');
        const { from_type, from_id, to_type } = ChangeItemTypeSchema.parse(args);
        const itemRepository = this.db.getItemRepository();
        try {
            const result = await itemRepository.changeItemType(from_type, String(from_id), to_type);
            if (!result.success) {
                throw new McpError(ErrorCode.InvalidRequest, result.error || 'Failed to change item type');
            }
            return {
                content: [{
                        type: 'text',
                        text: `## Type Change Successful

Item successfully migrated:
- From: ${from_type}-${from_id}
- To: ${to_type}-${result.new_id}

Note: The original item has been deleted.`
                    }]
            };
        }
        catch (error) {
            if (error instanceof McpError) {
                throw error;
            }
            this.logger.error('Failed to change item type', error);
            throw new McpError(ErrorCode.InternalError, `Failed to change item type: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
