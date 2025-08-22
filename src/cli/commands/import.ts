import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../../data-source.js';
import { Item } from '../../entities/Item.js';
import { SystemState } from '../../entities/SystemState.js';
import { Status } from '../../entities/Status.js';
import { Tag } from '../../entities/Tag.js';
import { ItemTag } from '../../entities/ItemTag.js';
import { ItemRelation } from '../../entities/ItemRelation.js';
import { ImportManagerTypeORM } from '../../services/import-manager.js';

export interface ImportOptions {
  file: string;
  clear?: boolean;
}

export async function importData(options: ImportOptions) {
  const manager = new ImportManagerTypeORM();
  
  try {
    const result = await manager.importPath(options.file, options);
    
    if (!result.success && result.errors && result.errors.length > 0) {
      console.error(chalk.red('Import had errors:'));
      for (const error of result.errors) {
        console.error(chalk.red(`  - ${error.message}`));
      }
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Import failed:'), error);
    process.exit(1);
  }
}

// Keep the original JSON import function for backward compatibility
export async function importDataJSON(options: ImportOptions) {
  try {
    // Check if file exists
    if (!fs.existsSync(options.file)) {
      console.error(chalk.red(`File not found: ${options.file}`));
      process.exit(1);
    }

    // Read and parse JSON
    const data = JSON.parse(fs.readFileSync(options.file, 'utf-8'));
    
    console.log(chalk.bold.cyan('📥 Data Import\n'));
    console.log(chalk.gray(`File: ${options.file}`));
    console.log(chalk.gray(`Items to import: ${data.items?.length || 0}`));

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Run migrations to ensure tables exist
    console.log(chalk.gray('Ensuring database schema...'));
    await AppDataSource.runMigrations();

    // Clear existing data if requested
    if (options.clear) {
      console.log(chalk.yellow('\n⚠️  Clearing existing data...'));
      
      // Delete in correct order due to foreign keys
      await AppDataSource.getRepository(ItemRelation).clear();
      await AppDataSource.getRepository(ItemTag).clear();
      await AppDataSource.getRepository(Item).clear();
      await AppDataSource.getRepository(Tag).clear();
      await AppDataSource.getRepository(Status).clear();
      await AppDataSource.getRepository(SystemState).clear();
      
      console.log(chalk.gray('Existing data cleared'));
    }

    // Import statuses first (ensure default statuses exist)
    const statusRepo = AppDataSource.getRepository(Status);
    const defaultStatuses = [
      'Open', 'Specification', 'Waiting', 'Ready', 
      'In Progress', 'Review', 'Testing', 'Pending',
      'Completed', 'Closed', 'Canceled', 'Rejected'
    ];
    
    const statusMap = new Map<string, number>();
    for (let i = 0; i < defaultStatuses.length; i++) {
      let status = await statusRepo.findOne({ where: { name: defaultStatuses[i] } });
      if (!status) {
        status = await statusRepo.save({
          name: defaultStatuses[i],
          isClosable: i >= 8, // Last 4 are closable
          sortOrder: i
        });
      }
      statusMap.set(defaultStatuses[i], status.id);
    }

    // Import items
    const itemRepo = AppDataSource.getRepository(Item);
    const tagRepo = AppDataSource.getRepository(Tag);
    const itemTagRepo = AppDataSource.getRepository(ItemTag);
    const relationRepo = AppDataSource.getRepository(ItemRelation);
    
    const idMap = new Map<number, number>(); // old ID -> new ID
    let importedCount = 0;

    for (const itemData of data.items || []) {
      // Get status ID
      let statusId = statusMap.get(itemData.status || 'Open');
      if (!statusId) {
        // Create status if not found
        const newStatus = await statusRepo.save({
          name: itemData.status || 'Open',
          isClosable: false,
          sortOrder: 999
        });
        statusId = newStatus.id;
        statusMap.set(itemData.status || 'Open', statusId);
      }

      // Create item
      const item = await itemRepo.save({
        type: itemData.type,
        title: itemData.title,
        description: itemData.description || '',
        content: itemData.content || '',
        statusId,
        priority: itemData.priority || 'MEDIUM',
        category: itemData.category,
        startDate: itemData.startDate ? new Date(itemData.startDate) : undefined,
        endDate: itemData.endDate ? new Date(itemData.endDate) : undefined,
        version: itemData.version,
        aiSummary: itemData.aiSummary,
        searchIndex: itemData.searchIndex,
        entities: itemData.entities,
        embedding: itemData.embedding ? Buffer.from(itemData.embedding, 'base64') : undefined,
      });

      idMap.set(itemData.id, item.id);

      // Import tags
      if (itemData.tags && Array.isArray(itemData.tags)) {
        for (const tagName of itemData.tags) {
          let tag = await tagRepo.findOne({ where: { name: tagName } });
          if (!tag) {
            tag = await tagRepo.save({ name: tagName });
          }
          await itemTagRepo.save({ itemId: item.id, tagId: tag.id });
        }
      }

      importedCount++;
      if (importedCount % 10 === 0) {
        console.log(chalk.gray(`Imported ${importedCount} items...`));
      }
    }

    // Import relations (second pass)
    console.log(chalk.gray('\nImporting relations...'));
    for (const itemData of data.items || []) {
      if (itemData.related && Array.isArray(itemData.related)) {
        const sourceId = idMap.get(itemData.id);
        if (!sourceId) continue;

        for (const oldTargetId of itemData.related) {
          const targetId = idMap.get(oldTargetId);
          if (targetId) {
            // Check if relation already exists
            const existing = await relationRepo.findOne({
              where: { sourceId, targetId }
            });
            if (!existing) {
              await relationRepo.save({ sourceId, targetId });
            }
          }
        }
      }
    }

    // Import system state
    if (data.systemState) {
      const stateRepo = AppDataSource.getRepository(SystemState);
      await stateRepo.save({
        version: data.systemState.version,
        content: data.systemState.content,
        summary: data.systemState.summary,
        metrics: typeof data.systemState.metrics === 'object' 
          ? JSON.stringify(data.systemState.metrics) 
          : data.systemState.metrics,
        context: typeof data.systemState.context === 'object'
          ? JSON.stringify(data.systemState.context)
          : data.systemState.context,
        checkpoint: typeof data.systemState.checkpoint === 'object'
          ? JSON.stringify(data.systemState.checkpoint)
          : data.systemState.checkpoint,
        relatedItems: Array.isArray(data.systemState.relatedItems)
          ? JSON.stringify(data.systemState.relatedItems)
          : data.systemState.relatedItems || '[]',
        tags: Array.isArray(data.systemState.tags)
          ? JSON.stringify(data.systemState.tags)
          : data.systemState.tags || '[]',
        metadata: typeof data.systemState.metadata === 'object'
          ? JSON.stringify(data.systemState.metadata)
          : data.systemState.metadata,
        isActive: true
      });
      console.log(chalk.gray('System state imported'));
    }

    console.log(chalk.bold.green(`\n✨ Import completed! Imported ${importedCount} items`));
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error(chalk.red('Import failed:'), error);
    process.exit(1);
  }
}