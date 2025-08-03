#!/usr/bin/env node
import { MCPServer } from './adapters/mcp/mcp-server.js';
import { initializeEnvironment, getEnvironmentConfig } from './core/config/environment-config.js';
async function main() {
    try {
        initializeEnvironment();
        const config = getEnvironmentConfig();
        if (config.features.debugLogging) {
            console.error(`=== 環境設定 ===`);
            console.error(`環境: ${config.type}`);
            console.error(`データベース: ${config.paths.database}`);
            console.error(`================`);
        }
        const server = new MCPServer(config.paths.database);
        await server.initialize();
        await server.start();
        process.on('SIGINT', async () => {
            console.error('Shutting down...');
            await server.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.error('Shutting down...');
            await server.stop();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
main().catch(console.error);
