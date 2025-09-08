import fs from 'fs/promises';
import path from 'path';

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
  SHIROKUMA_DATA_DIR: string;
  SHIROKUMA_EXPORT_DIR: string;
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
      SHIROKUMA_DATA_DIR: {
        type: 'string',
        required: false,
        description: 'Data directory path (defaults to .shirokuma/data-prod)',
        default: '.shirokuma/data-prod'
      },
      SHIROKUMA_EXPORT_DIR: {
        type: 'string',
        required: false,
        description: 'Export directory path',
        default: 'docs/export'
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
        version: '0.9.0'
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

}