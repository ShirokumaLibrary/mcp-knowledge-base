#!/usr/bin/env node

/**
 * @ai-context Migration script to add summary fields to Issues and Plans
 * @ai-pattern One-time migration for schema updates
 * @ai-critical Must be run before using summary fields
 * @ai-side-effects Alters SQLite schema permanently
 */

import { DatabaseConnection } from './database/base.js';
import { getConfig } from './config.js';
import { logger } from './utils/logger.js';

async function migrate() {
  logger.info('Starting summary field migration...');
  
  const config = getConfig();
  const connection = new DatabaseConnection(config.database.sqlitePath);
  
  try {
    await connection.initialize();
    const db = connection.getDatabase();
    
    // Check if summary column already exists in search_issues
    const issueColumns = await db.allAsync(`PRAGMA table_info(search_issues)`);
    const issueHasSummary = issueColumns.some((col: any) => col.name === 'summary');
    
    if (!issueHasSummary) {
      logger.info('Adding summary column to search_issues table...');
      await db.runAsync(`ALTER TABLE search_issues ADD COLUMN summary TEXT`);
      logger.info('Summary column added to search_issues');
    } else {
      logger.info('Summary column already exists in search_issues');
    }
    
    // Check if summary column already exists in search_plans
    const planColumns = await db.allAsync(`PRAGMA table_info(search_plans)`);
    const planHasSummary = planColumns.some((col: any) => col.name === 'summary');
    
    if (!planHasSummary) {
      logger.info('Adding summary column to search_plans table...');
      await db.runAsync(`ALTER TABLE search_plans ADD COLUMN summary TEXT`);
      logger.info('Summary column added to search_plans');
    } else {
      logger.info('Summary column already exists in search_plans');
    }
    
    // Check if summary column already exists in search_knowledge
    const knowledgeColumns = await db.allAsync(`PRAGMA table_info(search_knowledge)`);
    const knowledgeHasSummary = knowledgeColumns.some((col: any) => col.name === 'summary');
    
    if (!knowledgeHasSummary) {
      logger.info('Adding summary column to search_knowledge table...');
      await db.runAsync(`ALTER TABLE search_knowledge ADD COLUMN summary TEXT`);
      logger.info('Summary column added to search_knowledge');
    } else {
      logger.info('Summary column already exists in search_knowledge');
    }
    
    // Check if summary column already exists in search_docs
    const docsColumns = await db.allAsync(`PRAGMA table_info(search_docs)`);
    const docsHasSummary = docsColumns.some((col: any) => col.name === 'summary');
    
    if (!docsHasSummary) {
      logger.info('Adding summary column to search_docs table...');
      await db.runAsync(`ALTER TABLE search_docs ADD COLUMN summary TEXT`);
      logger.info('Summary column added to search_docs');
    } else {
      logger.info('Summary column already exists in search_docs');
    }
    
    // Update indexes to include summary in search
    logger.info('Updating search indexes...');
    
    // Drop and recreate indexes to include summary
    await db.runAsync(`DROP INDEX IF EXISTS idx_issues_text`);
    await db.runAsync(`CREATE INDEX idx_issues_text ON search_issues(title, content, summary)`);
    
    await db.runAsync(`DROP INDEX IF EXISTS idx_plans_text`);
    await db.runAsync(`CREATE INDEX idx_plans_text ON search_plans(title, content, summary)`);
    
    await db.runAsync(`DROP INDEX IF EXISTS idx_knowledge_text`);
    await db.runAsync(`CREATE INDEX idx_knowledge_text ON search_knowledge(title, content, summary)`);
    
    await db.runAsync(`DROP INDEX IF EXISTS idx_docs_text`);
    await db.runAsync(`CREATE INDEX idx_docs_text ON search_docs(title, content, summary)`);
    
    logger.info('Migration completed successfully');
    
  } catch (error) {
    logger.error('Migration failed:', { error });
    process.exit(1);
  } finally {
    connection.close();
  }
}

// Run migration
migrate().catch((error) => {
  logger.error('Unhandled error during migration:', { error });
  process.exit(1);
});