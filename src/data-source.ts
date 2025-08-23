import { DataSource } from 'typeorm';
import { Item } from './entities/Item.js';
import { SystemState } from './entities/SystemState.js';
import { Status } from './entities/Status.js';
import { Tag } from './entities/Tag.js';
import { ItemTag } from './entities/ItemTag.js';
import { ItemRelation } from './entities/ItemRelation.js';
import { Keyword } from './entities/Keyword.js';
import { ItemKeyword } from './entities/ItemKeyword.js';
import { Concept } from './entities/Concept.js';
import { ItemConcept } from './entities/ItemConcept.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine database path
function getDatabasePath(): string {
  // Check environment variable first
  const envPath = process.env.SHIROKUMA_DATA_DIR;
  if (envPath) {
    const dbPath = path.join(envPath, 'shirokuma.db');
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dbPath;
  }

  // Default to .shirokuma/data in project or home directory
  const projectPath = path.resolve(__dirname, '../..', '.shirokuma', 'data', 'shirokuma.db');
  const projectDir = path.dirname(projectPath);
  
  // Try project directory first
  if (fs.existsSync(projectDir) || process.cwd().includes('shirokuma')) {
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    return projectPath;
  }

  // Fall back to home directory for global installation
  const homePath = path.join(os.homedir(), '.shirokuma', 'data', 'shirokuma.db');
  const homeDir = path.dirname(homePath);
  if (!fs.existsSync(homeDir)) {
    fs.mkdirSync(homeDir, { recursive: true });
  }
  return homePath;
}

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: getDatabasePath(),
  synchronize: false, // We'll use migrations
  logging: false,
  entities: [
    Item, 
    SystemState, 
    Status, 
    Tag, 
    ItemTag, 
    ItemRelation,
    Keyword,
    ItemKeyword,
    Concept,
    ItemConcept
  ],
  migrations: [path.join(__dirname, 'migrations', '*.js')],
  subscribers: [],
});