import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration schema definition
interface ConfigField {
  type: 'string' | 'enum';
  required: boolean;
  description: string;
  default?: string;
  values?: string[];
  sensitive?: boolean;
}

interface ConfigSchema {
  [key: string]: ConfigField;
}

// Configuration type
export interface Config {
  SHIROKUMA_DATABASE_URL: string;
  SHIROKUMA_DATA_DIR: string;
  SHIROKUMA_EXPORT_DIR: string;
  NODE_ENV: string;
  ANTHROPIC_API_KEY?: string;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ConfigManager {
  private schema: ConfigSchema;

  constructor() {
    this.schema = {
      SHIROKUMA_DATABASE_URL: {
        type: 'string',
        required: true,
        description: 'Prisma database connection URL',
        default: `file:${path.join(os.homedir(), '.shirokuma', 'data', 'shirokuma.db')}`
      },
      SHIROKUMA_DATA_DIR: {
        type: 'string',
        required: false,
        description: 'Data directory path',
        default: path.join(os.homedir(), '.shirokuma', 'data')
      },
      SHIROKUMA_EXPORT_DIR: {
        type: 'string',
        required: false,
        description: 'Export directory path',
        default: 'docs/export'
      },
      ANTHROPIC_API_KEY: {
        type: 'string',
        required: false,
        description: 'Claude API key (optional)',
        sensitive: true
      },
      NODE_ENV: {
        type: 'enum',
        required: false,
        description: 'Environment type',
        values: ['development', 'production', 'test'],
        default: 'development'
      }
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): Config {
    const config: Partial<Config> = {};

    for (const [key, field] of Object.entries(this.schema)) {
      const value = process.env[key] || field.default;
      if (value !== undefined) {
        (config as Record<string, unknown>)[key] = value;
      }
    }

    // If SHIROKUMA_DATABASE_URL is not set but SHIROKUMA_DATA_DIR is, derive SHIROKUMA_DATABASE_URL from it
    if (!process.env.SHIROKUMA_DATABASE_URL && config.SHIROKUMA_DATA_DIR) {
      const dataDir = (config.SHIROKUMA_DATA_DIR as string).replace(/^~/, os.homedir());
      const dbPath = `file:${dataDir}/shirokuma.db`;
      config.SHIROKUMA_DATABASE_URL = dbPath;
    }

    return config as Config;
  }

  /**
   * Export configuration in specified format
   */
  exportConfig(format: 'env' | 'json'): string {
    const config = this.getConfig();

    if (format === 'json') {
      const exportData: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(config)) {
        const field = this.schema[key];
        if (field?.sensitive && value) {
          exportData[key] = '***REDACTED***';
        } else {
          exportData[key] = value;
        }
      }

      exportData._metadata = {
        exported_at: new Date().toISOString(),
        version: '0.8.0'
      };

      return JSON.stringify(exportData, null, 2);
    }

    // env format
    let envContent = '# Environment configuration exported\n';
    envContent += `# Exported at: ${new Date().toISOString()}\n\n`;

    for (const [key, value] of Object.entries(config)) {
      const field = this.schema[key];
      if (field?.description) {
        envContent += `# ${field.description}\n`;
      }

      if (field?.sensitive && value) {
        envContent += `${key}=***REDACTED***\n`;
      } else if (value !== undefined) {
        envContent += `${key}=${value}\n`;
      }
      envContent += '\n';
    }

    return envContent;
  }

  /**
   * Import configuration from string
   */
  importConfig(data: string, format: 'env' | 'json'): void {
    if (format === 'json') {
      const parsed = JSON.parse(data);
      for (const [key, value] of Object.entries(parsed)) {
        // Skip metadata and redacted values
        if (key !== '_metadata' && value !== '***REDACTED***') {
          // Validate against schema before importing
          if (this.schema[key]) {
            // Don't import sensitive fields unless explicitly set
            if (this.schema[key].sensitive && !value) {
              continue;
            }
            process.env[key] = String(value);
          }
        }
      }
    } else {
      // Parse env format
      const lines = data.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=');
          if (key && value && value !== '***REDACTED***') {
            // Validate against schema
            if (this.schema[key]) {
              // Don't import sensitive fields with placeholder values
              if (this.schema[key].sensitive && value === 'your-secret-key-here') {
                continue;
              }
              process.env[key] = value;
            }
          }
        }
      }
    }
  }

  /**
   * Validate current configuration
   */
  validateConfig(): ValidationResult {
    const errors: string[] = [];

    for (const [key, field] of Object.entries(this.schema)) {
      const value = process.env[key];

      // Check required fields (without considering defaults)
      if (field.required && !value) {
        errors.push(`${key} is required`);
      }

      // Check enum values
      if (field.type === 'enum' && value && field.values) {
        if (!field.values.includes(value)) {
          errors.push(`${key} must be one of: ${field.values.join(', ')}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Switch to different environment
   */
  async switchEnvironment(env: 'development' | 'production' | 'test'): Promise<void> {
    const configDir = path.join(process.cwd(), '.shirokuma', 'config');
    const envFile = path.join(configDir, `${env}.env`);

    try {
      const content = await fs.readFile(envFile, 'utf-8');
      this.importConfig(content, 'env');
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        throw new Error('Environment file not found');
      }
      throw error;
    }
  }

  /**
   * Get configuration schema
   */
  getSchema(): ConfigSchema {
    return this.schema;
  }

  /**
   * Create .env.example file
   */
  async createEnvExample(): Promise<void> {
    const examplePath = path.join(process.cwd(), '.env.example');
    let content = '# Example environment configuration\n';
    content += '# Copy this file to .env and update with your values\n\n';

    for (const [key, field] of Object.entries(this.schema)) {
      if (field.description) {
        content += `# ${field.description}\n`;
      }

      if (field.type === 'enum' && field.values) {
        content += `# Values: ${field.values.join(', ')}\n`;
      }

      if (field.sensitive) {
        content += `# ${key}=your-secret-key-here\n`;
      } else if (field.default) {
        content += `${key}=${field.default}\n`;
      } else {
        content += `# ${key}=\n`;
      }
      content += '\n';
    }

    // .env.example can be readable by all (644)
    await fs.writeFile(examplePath, content, {
      encoding: 'utf-8',
      mode: 0o644
    });
  }

  /**
   * Save configuration to file
   */
  async saveConfig(filepath: string, format: 'env' | 'json' = 'env'): Promise<void> {
    const content = this.exportConfig(format);

    // Write with restricted permissions (600 - owner read/write only)
    await fs.writeFile(filepath, content, {
      encoding: 'utf-8',
      mode: 0o600
    });
  }

  /**
   * Load configuration from file
   */
  async loadConfig(filepath: string, format: 'env' | 'json' = 'env'): Promise<void> {
    const content = await fs.readFile(filepath, 'utf-8');
    this.importConfig(content, format);
  }
}