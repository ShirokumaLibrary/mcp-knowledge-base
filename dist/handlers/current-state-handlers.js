import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { UpdateCurrentStateSchema } from '../schemas/current-state-schemas.js';
import { createLogger } from '../utils/logger.js';
import * as path from 'path';
import * as fs from 'fs/promises';
export class CurrentStateHandlers {
    dataDir;
    logger = createLogger('CurrentStateHandlers');
    handlerName = 'CurrentStateHandlers';
    filePath;
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.filePath = path.join(dataDir, 'current_state.md');
    }
    async handleGetCurrentState() {
        this.logger.info('Getting current state');
        try {
            const content = await fs.readFile(this.filePath, 'utf-8');
            return {
                content: [{
                        type: 'text',
                        text: content
                    }]
            };
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return {
                    content: [{
                            type: 'text',
                            text: ''
                        }]
                };
            }
            this.logger.error('Failed to read current state', error);
            throw new McpError(ErrorCode.InternalError, `Failed to read current state: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async handleUpdateCurrentState(args) {
        this.logger.info('Updating current state');
        const { content } = UpdateCurrentStateSchema.parse(args);
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            await fs.writeFile(this.filePath, content, 'utf-8');
            return {
                content: [{
                        type: 'text',
                        text: 'Current state updated successfully'
                    }]
            };
        }
        catch (error) {
            this.logger.error('Failed to update current state', error);
            throw new McpError(ErrorCode.InternalError, `Failed to update current state: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
