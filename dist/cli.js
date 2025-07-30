#!/usr/bin/env node
import { spawn } from 'child_process';
import { program } from 'commander';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
program
    .name('shirokuma-mcp')
    .description('Shirokuma MCP Knowledge Base Server')
    .version(packageJson.version)
    .option('-d, --data <path>', 'custom data directory path', '.shirokuma/data')
    .option('-p, --port <port>', 'server port (stdio by default)')
    .option('--rebuild', 'rebuild database from markdown files')
    .option('--inspect', 'launch with MCP inspector')
    .action((options) => {
    if (options.data) {
        process.env.MCP_DATABASE_PATH = options.data;
    }
    if (options.rebuild) {
        const rebuild = spawn('node', [path.join(__dirname, 'rebuild-db.js')], {
            stdio: 'inherit',
            env: process.env
        });
        rebuild.on('exit', (code) => {
            process.exit(code || 0);
        });
    }
    else if (options.inspect) {
        const inspect = spawn('npx', [
            '@modelcontextprotocol/inspector',
            'node',
            path.join(__dirname, 'server.js')
        ], {
            stdio: 'inherit',
            env: process.env
        });
        inspect.on('exit', (code) => {
            process.exit(code || 0);
        });
    }
    else {
        const server = spawn('node', [path.join(__dirname, 'server.js')], {
            stdio: 'inherit',
            env: process.env
        });
        server.on('exit', (code) => {
            process.exit(code || 0);
        });
    }
});
program
    .command('rebuild')
    .description('Rebuild database from markdown files')
    .option('-d, --data <path>', 'custom data directory path')
    .action((options) => {
    if (options.data) {
        process.env.MCP_DATABASE_PATH = options.data;
    }
    const rebuild = spawn('node', [path.join(__dirname, 'rebuild-db.js')], {
        stdio: 'inherit',
        env: process.env
    });
    rebuild.on('exit', (code) => {
        process.exit(code || 0);
    });
});
program.parse();
