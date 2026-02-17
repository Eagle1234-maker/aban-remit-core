/**
 * Configuration loader for validation settings
 * Loads configuration from file, environment variables, and CLI arguments
 */

import fs from 'fs-extra';
import path from 'path';
import { ValidationConfig, CLIOptions } from './types.js';

/**
 * Get default configuration values (reads environment variables dynamically)
 */
function getDefaultConfig(): ValidationConfig {
  return {
    api: {
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      timeout: 5000,
    },
    database: {
      connectionString: process.env.DATABASE_URL || '',
    },
    redis: process.env.REDIS_HOST
      ? {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        }
      : undefined,
    testCredentials: {
      username: process.env.TEST_USERNAME || 'test@example.com',
      password: process.env.TEST_PASSWORD || 'TestPassword123!',
    },
    autoFix: {
      enabled: false,
      createMissingPages: true,
      fixBrokenAPIs: false,
    },
    output: {
      filePath: './validation-report.json',
      format: 'both',
    },
    phases: {
      frontendBackend: true,
      backendDatabase: true,
      realTime: true,
      pageCompleteness: true,
      security: true,
      healthEndpoint: true,
      architecture: true,
    },
  };
}

/**
 * Load configuration from file
 */
async function loadConfigFile(configPath: string): Promise<Partial<ValidationConfig>> {
  try {
    const exists = await fs.pathExists(configPath);
    if (!exists) {
      return {};
    }

    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Warning: Failed to load config file from ${configPath}:`, error);
    return {};
  }
}

/**
 * Merge configuration from multiple sources
 * Priority: CLI args > Environment variables > Config file > Defaults
 */
function mergeConfig(
  defaults: ValidationConfig,
  fileConfig: Partial<ValidationConfig>,
  cliOptions: CLIOptions
): ValidationConfig {
  const merged = { ...defaults };

  // Merge file config (lower priority than env vars, which are in defaults)
  if (fileConfig.api) {
    // Only override baseURL if env var wasn't set
    if (!process.env.API_BASE_URL && fileConfig.api.baseURL !== undefined) {
      merged.api.baseURL = fileConfig.api.baseURL;
    }
    if (fileConfig.api.timeout !== undefined) {
      merged.api.timeout = fileConfig.api.timeout;
    }
  }
  
  if (fileConfig.database) {
    // Only override if env var wasn't set
    if (!process.env.DATABASE_URL && fileConfig.database.connectionString !== undefined) {
      merged.database.connectionString = fileConfig.database.connectionString;
    }
  }
  
  if (fileConfig.redis) {
    // Only override if env vars weren't set
    if (!process.env.REDIS_HOST) {
      merged.redis = fileConfig.redis;
    }
  }
  
  if (fileConfig.testCredentials) {
    // Only override if env vars weren't set
    if (!process.env.TEST_USERNAME && fileConfig.testCredentials.username !== undefined) {
      merged.testCredentials.username = fileConfig.testCredentials.username;
    }
    if (!process.env.TEST_PASSWORD && fileConfig.testCredentials.password !== undefined) {
      merged.testCredentials.password = fileConfig.testCredentials.password;
    }
  }
  
  if (fileConfig.autoFix) {
    merged.autoFix = { ...merged.autoFix, ...fileConfig.autoFix };
  }
  
  if (fileConfig.output) {
    merged.output = { ...merged.output, ...fileConfig.output };
  }
  
  if (fileConfig.phases) {
    merged.phases = { ...merged.phases, ...fileConfig.phases };
  }

  // Apply CLI options (highest priority)
  if (cliOptions.autoFix !== undefined) {
    merged.autoFix.enabled = cliOptions.autoFix;
  }
  if (cliOptions.outputPath) {
    merged.output.filePath = cliOptions.outputPath;
  }
  if (cliOptions.phases && cliOptions.phases.length > 0) {
    // Disable all phases first
    Object.keys(merged.phases).forEach((key) => {
      merged.phases[key as keyof typeof merged.phases] = false;
    });
    // Enable only specified phases
    cliOptions.phases.forEach((phase) => {
      if (phase in merged.phases) {
        merged.phases[phase as keyof typeof merged.phases] = true;
      }
    });
  }

  return merged;
}

/**
 * Validate configuration completeness
 */
function validateConfig(config: ValidationConfig): void {
  const errors: string[] = [];

  if (!config.api.baseURL) {
    errors.push('API base URL is required');
  }

  if (!config.database.connectionString) {
    errors.push('Database connection string is required');
  }

  if (!config.testCredentials.username || !config.testCredentials.password) {
    errors.push('Test credentials (username and password) are required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Load and merge configuration from all sources
 */
export async function loadConfig(cliOptions: CLIOptions): Promise<ValidationConfig> {
  // Determine config file path
  const configPath = cliOptions.configPath || path.join(process.cwd(), 'validation.config.json');

  // Load config file
  const fileConfig = await loadConfigFile(configPath);

  // Get default config (reads environment variables dynamically)
  const defaultConfig = getDefaultConfig();

  // Merge all configuration sources
  const config = mergeConfig(defaultConfig, fileConfig, cliOptions);

  // Validate configuration
  validateConfig(config);

  return config;
}

/**
 * Create a template configuration file
 */
export async function createConfigTemplate(outputPath: string): Promise<void> {
  const template: ValidationConfig = {
    api: {
      baseURL: 'http://localhost:3000',
      timeout: 5000,
    },
    database: {
      connectionString: 'postgresql://user:password@localhost:5432/aban_remit',
    },
    redis: {
      host: 'localhost',
      port: 6379,
    },
    testCredentials: {
      username: 'test@example.com',
      password: 'TestPassword123!',
    },
    autoFix: {
      enabled: true,
      createMissingPages: true,
      fixBrokenAPIs: false,
    },
    output: {
      filePath: './validation-report.json',
      format: 'both',
    },
    phases: {
      frontendBackend: true,
      backendDatabase: true,
      realTime: true,
      pageCompleteness: true,
      security: true,
      healthEndpoint: true,
      architecture: true,
    },
  };

  await fs.writeFile(outputPath, JSON.stringify(template, null, 2), 'utf-8');
  console.log(`Configuration template created at: ${outputPath}`);
}
