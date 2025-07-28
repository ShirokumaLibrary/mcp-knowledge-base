#!/usr/bin/env node
/**
 * @ai-context Database rebuild utility for disaster recovery
 * @ai-pattern Command-line tool that reconstructs SQLite from markdown files
 * @ai-critical Used when database is corrupted or out of sync
 * @ai-flow 1. Drop DB -> 2. Reinitialize -> 3. Scan files -> 4. Rebuild data
 * @ai-assumption Markdown files are source of truth
 */
export {};
