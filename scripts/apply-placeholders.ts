#!/usr/bin/env tsx

/**
 * Apply Placeholders Script
 *
 * Replaces hardcoded MCP references with placeholders in master template files.
 *
 * Pattern: mcp__shirokuma-kb__ → {{MCP_NAME}}__
 * Scope: .shirokuma/agents/**\/*.md, .shirokuma/commands/**\/*.md
 *
 * Usage:
 *   tsx scripts/apply-placeholders.ts
 *   tsx scripts/apply-placeholders.ts --dry-run
 *   tsx scripts/apply-placeholders.ts --backup
 */

import { readdir, readFile, writeFile, mkdir, copyFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';

interface ProcessResult {
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  replacements: number;
  errors: string[];
  changes: Array<{
    file: string;
    replacements: number;
  }>;
}

interface Options {
  dryRun: boolean;
  backup: boolean;
  verbose: boolean;
}

const HARDCODED_PATTERN = /mcp__shirokuma-kb__/g;
const PLACEHOLDER = '{{MCP_NAME}}__';

class PlaceholderApplicator {
  private result: ProcessResult = {
    totalFiles: 0,
    processedFiles: 0,
    skippedFiles: 0,
    replacements: 0,
    errors: [],
    changes: []
  };

  constructor(private options: Options) {}

  /**
   * Main execution method
   */
  async execute(): Promise<ProcessResult> {
    console.log('🚀 Starting placeholder application...\n');

    const projectRoot = process.cwd();
    const agentsDir = join(projectRoot, '.shirokuma', 'agents');
    const commandsDir = join(projectRoot, '.shirokuma', 'commands');

    // Check if directories exist
    if (!existsSync(agentsDir)) {
      this.result.errors.push(`Agents directory not found: ${agentsDir}`);
      return this.result;
    }

    if (!existsSync(commandsDir)) {
      this.result.errors.push(`Commands directory not found: ${commandsDir}`);
      return this.result;
    }

    // Create backup directory if needed
    if (this.options.backup && !this.options.dryRun) {
      await this.createBackup(projectRoot);
    }

    // Process directories
    await this.processDirectory(agentsDir);
    await this.processDirectory(commandsDir);

    return this.result;
  }

  /**
   * Create backup of template files
   */
  private async createBackup(projectRoot: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(projectRoot, '.shirokuma', `backup-${timestamp}`);

    console.log(`📦 Creating backup: ${backupDir}\n`);

    await mkdir(backupDir, { recursive: true });

    const agentsBackup = join(backupDir, 'agents');
    const commandsBackup = join(backupDir, 'commands');

    await this.copyDirectory(
      join(projectRoot, '.shirokuma', 'agents'),
      agentsBackup
    );

    await this.copyDirectory(
      join(projectRoot, '.shirokuma', 'commands'),
      commandsBackup
    );

    console.log(`✅ Backup created successfully\n`);
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(source: string, dest: string): Promise<void> {
    await mkdir(dest, { recursive: true });

    const entries = await readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = join(source, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else if (entry.isFile()) {
        await copyFile(sourcePath, destPath);
      }
    }
  }

  /**
   * Process directory recursively
   */
  private async processDirectory(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await this.processDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        await this.processFile(fullPath);
      }
    }
  }

  /**
   * Process single file
   */
  private async processFile(filePath: string): Promise<void> {
    this.result.totalFiles++;

    try {
      const content = await readFile(filePath, 'utf-8');

      // Count replacements
      const matches = content.match(HARDCODED_PATTERN);
      const replacementCount = matches ? matches.length : 0;

      if (replacementCount === 0) {
        this.result.skippedFiles++;
        if (this.options.verbose) {
          console.log(`⏭️  Skipped (no matches): ${relative(process.cwd(), filePath)}`);
        }
        return;
      }

      // Apply replacement
      const newContent = content.replace(HARDCODED_PATTERN, PLACEHOLDER);

      // Verify replacement worked
      if (newContent === content) {
        this.result.skippedFiles++;
        return;
      }

      // Record change
      this.result.processedFiles++;
      this.result.replacements += replacementCount;
      this.result.changes.push({
        file: relative(process.cwd(), filePath),
        replacements: replacementCount
      });

      // Write file (unless dry run)
      if (!this.options.dryRun) {
        await writeFile(filePath, newContent, 'utf-8');
      }

      const dryRunLabel = this.options.dryRun ? '[DRY RUN] ' : '';
      console.log(`✅ ${dryRunLabel}Processed: ${relative(process.cwd(), filePath)} (${replacementCount} replacements)`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.result.errors.push(`Failed to process ${filePath}: ${errorMessage}`);
      console.error(`❌ Error processing ${relative(process.cwd(), filePath)}: ${errorMessage}`);
    }
  }

  /**
   * Print summary
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(`Total files scanned:     ${this.result.totalFiles}`);
    console.log(`Files processed:         ${this.result.processedFiles}`);
    console.log(`Files skipped:           ${this.result.skippedFiles}`);
    console.log(`Total replacements:      ${this.result.replacements}`);
    console.log(`Errors:                  ${this.result.errors.length}`);

    if (this.result.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.result.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (this.result.changes.length > 0 && this.options.verbose) {
      console.log('\n📝 Changed files:');
      this.result.changes.forEach(change => {
        console.log(`  - ${change.file} (${change.replacements} replacements)`);
      });
    }

    console.log('='.repeat(60));

    if (this.options.dryRun) {
      console.log('\n⚠️  DRY RUN MODE: No files were modified');
    } else {
      console.log('\n✅ Placeholder application completed successfully');
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): Options {
  const args = process.argv.slice(2);

  return {
    dryRun: args.includes('--dry-run'),
    backup: args.includes('--backup') || !args.includes('--no-backup'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const options = parseArgs();

  console.log('🔧 Placeholder Application Script');
  console.log('================================\n');
  console.log('Options:');
  console.log(`  Dry run: ${options.dryRun}`);
  console.log(`  Backup:  ${options.backup}`);
  console.log(`  Verbose: ${options.verbose}`);
  console.log('\n');

  const applicator = new PlaceholderApplicator(options);

  try {
    const result = await applicator.execute();
    applicator.printSummary();

    // Exit with error if any errors occurred
    if (result.errors.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

export { PlaceholderApplicator, type Options, type ProcessResult };

// Run if executed directly (ESM compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
