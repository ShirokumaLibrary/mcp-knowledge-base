#!/usr/bin/env node
import { MCPServer } from './adapters/mcp/mcp-server.js';
import { DatabaseConnection } from './infrastructure/database/connection.js';
import { initializeEnvironment, getEnvironmentConfig } from './core/config/environment-config.js';
process.env.NODE_ENV = 'test';
async function startTestServer() {
    try {
        initializeEnvironment();
        const config = getEnvironmentConfig();
        console.error('[TEST] Environment initialized');
        console.error(`[TEST] Database root: ${config.paths.root}`);
        if (config.database) {
            console.error('[TEST] Database configuration:');
            console.error(`[TEST]   poolSize=${config.database.poolSize}`);
            console.error(`[TEST]   timeout=${config.database.timeout}`);
            console.error(`[TEST]   maxRetries=${config.database.maxRetries}`);
        }
        if (config.features.experimentalSearch !== undefined) {
            console.error(`[TEST] experimentalSearch=${config.features.experimentalSearch}`);
        }
        const connection = new DatabaseConnection(config.paths.database);
        await connection.initialize();
        const db = connection.getDatabase();
        const count = db.prepare('SELECT COUNT(*) as count FROM items').get();
        if (count.count === 0) {
            console.error('[TEST] Creating sample test data...');
            const insertItem = db.prepare(`
        INSERT INTO items (id, type, local_id, title, description, content, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
            insertItem.run('issues-1', 'issues', '1', 'Test Issue: Setup CI/CD Pipeline', 'Configure automated testing and deployment', null, 'Open', 'high');
            insertItem.run('docs-1', 'docs', '1', 'Test Environment Setup Guide', 'Guide for setting up the test environment', '# Test Environment Setup\n\nThis guide explains how to set up the test environment.', null, null);
        }
        const server = new MCPServer(config.paths.database);
        await server.start();
        process.on('SIGINT', async () => {
            console.error('\n[TEST] Shutting down test server...');
            connection.close();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('[ERROR] Failed to start test server:', error);
        process.exit(1);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    startTestServer();
}
