import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../../data-source.js';
import { Item } from '../../entities/Item.js';
import { SystemState } from '../../entities/SystemState.js';

export interface ExportOptions {
  dir?: string;
  format?: 'json' | 'markdown' | 'both';
  type?: string;
  status?: string;
}

export async function exportData(options: ExportOptions) {
  try {
    // Initialize data source
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const itemRepo = AppDataSource.getRepository(Item);
    const stateRepo = AppDataSource.getRepository(SystemState);

    // Build query
    const queryBuilder = itemRepo.createQueryBuilder('item');
    
    if (options.type) {
      queryBuilder.andWhere('item.type = :type', { type: options.type });
    }
    
    if (options.status) {
      queryBuilder.andWhere('item.status = :status', { status: options.status });
    }
    
    queryBuilder.orderBy('item.type', 'ASC')
                .addOrderBy('item.id', 'ASC');

    const items = await queryBuilder.getMany();
    const systemStates = await stateRepo.find({ order: { id: 'DESC' }, take: 1 });
    const systemState = systemStates.length > 0 ? systemStates[0] : null;

    console.log(chalk.bold.cyan('📤 Data Export\n'));
    console.log(chalk.gray(`Items to export: ${items.length}`));

    if (items.length === 0) {
      console.log(chalk.yellow('No items found to export'));
      return;
    }

    // Determine export directory
    const exportDir = options.dir || path.join(process.cwd(), 'docs', 'export');
    
    // Ensure export directory exists
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const format = options.format || 'both';
    let jsonFile = '';
    let markdownCount = 0;

    // Export as JSON
    if (format === 'json' || format === 'both') {
      const exportData = {
        version: '0.9.0',
        exportDate: new Date().toISOString(),
        items: items.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          content: item.content,
          status: 'Open', // TODO: lookup status name from statusId
          priority: item.priority,
          category: item.category,
          startDate: item.startDate,
          endDate: item.endDate,
          version: item.version,
          tags: [], // TODO: lookup tags from item_tags table
          related: [], // TODO: lookup relations from item_relations table
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        })),
        systemState: systemState ? {
          content: systemState.content,
          tags: systemState.tags || [],
          metadata: systemState.metadata || {},
          createdAt: systemState.createdAt,
          updatedAt: systemState.updatedAt
        } : null
      };

      jsonFile = path.join(exportDir, `export-${Date.now()}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(exportData, null, 2));
      console.log(chalk.green(`✅ JSON export: ${jsonFile}`));
    }

    // Export as Markdown
    if (format === 'markdown' || format === 'both') {
      // Group items by type
      const itemsByType = new Map<string, Item[]>();
      for (const item of items) {
        if (!itemsByType.has(item.type)) {
          itemsByType.set(item.type, []);
        }
        itemsByType.get(item.type)!.push(item);
      }

      // Create directories and files for each type
      for (const [type, typeItems] of itemsByType) {
        const typeDir = path.join(exportDir, type);
        if (!fs.existsSync(typeDir)) {
          fs.mkdirSync(typeDir, { recursive: true });
        }

        for (const item of typeItems) {
          const filename = `${item.id}-${sanitizeFilename(item.title)}.md`;
          const filepath = path.join(typeDir, filename);
          
          const markdown = generateMarkdown(item);
          fs.writeFileSync(filepath, markdown);
          markdownCount++;
        }
      }

      // Export system state
      if (systemState) {
        const systemDir = path.join(exportDir, '.system', 'current_state');
        if (!fs.existsSync(systemDir)) {
          fs.mkdirSync(systemDir, { recursive: true });
        }
        
        const stateFile = path.join(systemDir, `${systemState.id}.md`);
        const stateMarkdown = `# System State #${systemState.id}

**Updated**: ${systemState.updatedAt}
**Tags**: ${systemState.tags ? JSON.parse(systemState.tags).join(', ') : ''}

## Content

${systemState.content}

## Metadata

\`\`\`json
${JSON.stringify(systemState.metadata || {}, null, 2)}
\`\`\`
`;
        fs.writeFileSync(stateFile, stateMarkdown);
        
        // Also create a symlink to latest
        const latestFile = path.join(systemDir, 'latest.md');
        if (fs.existsSync(latestFile)) {
          fs.unlinkSync(latestFile);
        }
        fs.copyFileSync(stateFile, latestFile);
      }

      console.log(chalk.green(`✅ Markdown export: ${markdownCount} files in ${exportDir}`));
    }

    console.log(chalk.bold.green('\n✨ Export completed successfully!'));
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error(chalk.red('Export failed:'), error);
    process.exit(1);
  }
}

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

function generateMarkdown(item: Item): string {
  const sections = [];
  
  // Header
  sections.push(`# ${item.title}`);
  sections.push('');
  
  // Metadata
  sections.push('## Metadata');
  sections.push('');
  sections.push(`- **ID**: ${item.id}`);
  sections.push(`- **Type**: ${item.type}`);
  sections.push(`- **Status ID**: ${item.statusId}`);
  sections.push(`- **Priority**: ${item.priority}`);
  if (item.category) sections.push(`- **Category**: ${item.category}`);
  if (item.version) sections.push(`- **Version**: ${item.version}`);
  // TODO: Add tags and relations lookup
  sections.push(`- **Created**: ${item.createdAt}`);
  sections.push(`- **Updated**: ${item.updatedAt}`);
  sections.push('');
  
  // Description
  if (item.description) {
    sections.push('## Description');
    sections.push('');
    sections.push(item.description);
    sections.push('');
  }
  
  // Content
  if (item.content) {
    sections.push('## Content');
    sections.push('');
    sections.push(item.content);
    sections.push('');
  }
  
  // Dates
  if (item.startDate || item.endDate) {
    sections.push('## Timeline');
    sections.push('');
    if (item.startDate) sections.push(`- **Start**: ${item.startDate}`);
    if (item.endDate) sections.push(`- **End**: ${item.endDate}`);
    sections.push('');
  }
  
  return sections.join('\n');
}