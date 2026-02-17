/**
 * Unit tests for configuration loader
 * Tests configuration loading, merging, and validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { loadConfig, createConfigTemplate } from './config-loader.js';
import { CLIOptions, ValidationConfig } from './types.js';

// Mock fs-extra
vi.mock('fs-extra');

describe('Configuration Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.API_BASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.TEST_USERNAME;
    delete process.env.TEST_PASSWORD;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadConfig', () => {
    it('should load default configuration when no config file exists', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const cliOptions: CLIOptions = {};
      const config = await loadConfig(cliOptions);

      expect(config.api.baseURL).toBe('http://localhost:3000');
      expect(config.api.timeout).toBe(5000);
      expect(config.autoFix.enabled).toBe(false);
      expect(config.output.format).toBe('both');
    });

    it('should load configuration from file when it exists', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      
      const fileConfig: Partial<ValidationConfig> = {
        api: {
          baseURL: 'http://api.example.com',
          timeout: 10000,
        },
        autoFix: {
          enabled: true,
          createMissingPages: true,
          fixBrokenAPIs: true,
        },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(fileConfig));

      const cliOptions: CLIOptions = {};
      const config = await loadConfig(cliOptions);

      expect(config.api.baseURL).toBe('http://api.example.com');
      expect(config.api.timeout).toBe(10000);
      expect(config.autoFix.enabled).toBe(true);
      expect(config.autoFix.fixBrokenAPIs).toBe(true);
    });

    it('should load configuration from environment variables', async () => {
      process.env.API_BASE_URL = 'http://env.example.com';
      process.env.DATABASE_URL = 'postgresql://env:pass@localhost:5432/env_db';
      process.env.REDIS_HOST = 'redis.example.com';
      process.env.REDIS_PORT = '6380';
      process.env.TEST_USERNAME = 'env@test.com';
      process.env.TEST_PASSWORD = 'EnvPassword123!';

      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const cliOptions: CLIOptions = {};
      const config = await loadConfig(cliOptions);

      expect(config.api.baseURL).toBe('http://env.example.com');
      expect(config.database.connectionString).toBe('postgresql://env:pass@localhost:5432/env_db');
      expect(config.redis?.host).toBe('redis.example.com');
      expect(config.redis?.port).toBe(6380);
      expect(config.testCredentials.username).toBe('env@test.com');
      expect(config.testCredentials.password).toBe('EnvPassword123!');
    });

    it('should merge configuration with correct priority: CLI > Env > File > Defaults', async () => {
      // Set environment variables
      process.env.API_BASE_URL = 'http://env.example.com';
      process.env.DATABASE_URL = 'postgresql://env:pass@localhost:5432/db';

      // Mock file config
      const fileConfig: Partial<ValidationConfig> = {
        api: {
          baseURL: 'http://file.example.com',
          timeout: 8000,
        },
        output: {
          filePath: './file-report.json',
          format: 'json',
        },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(fileConfig));

      // CLI options override everything
      const cliOptions: CLIOptions = {
        autoFix: true,
        outputPath: './cli-report.json',
      };

      const config = await loadConfig(cliOptions);

      // CLI overrides file and env
      expect(config.autoFix.enabled).toBe(true);
      expect(config.output.filePath).toBe('./cli-report.json');

      // Env overrides file
      expect(config.api.baseURL).toBe('http://env.example.com');
      expect(config.database.connectionString).toBe('postgresql://env:pass@localhost:5432/db');

      // File overrides defaults
      expect(config.api.timeout).toBe(8000);
    });

    it('should enable only specified phases when phases option is provided', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const cliOptions: CLIOptions = {
        phases: ['frontendBackend', 'security'],
      };

      const config = await loadConfig(cliOptions);

      expect(config.phases.frontendBackend).toBe(true);
      expect(config.phases.security).toBe(true);
      expect(config.phases.backendDatabase).toBe(false);
      expect(config.phases.realTime).toBe(false);
      expect(config.phases.pageCompleteness).toBe(false);
      expect(config.phases.healthEndpoint).toBe(false);
      expect(config.phases.architecture).toBe(false);
    });

    it('should use custom config path when provided', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      
      const customPath = '/custom/path/config.json';
      const fileConfig: Partial<ValidationConfig> = {
        api: {
          baseURL: 'http://custom.example.com',
          timeout: 7000,
        },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(fileConfig));

      const cliOptions: CLIOptions = {
        configPath: customPath,
      };

      await loadConfig(cliOptions);

      expect(fs.pathExists).toHaveBeenCalledWith(customPath);
      expect(fs.readFile).toHaveBeenCalledWith(customPath, 'utf-8');
    });

    it('should handle invalid JSON in config file gracefully', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue('invalid json {');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const cliOptions: CLIOptions = {};
      const config = await loadConfig(cliOptions);

      // Should fall back to defaults
      expect(config.api.baseURL).toBe('http://localhost:3000');
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should throw error when API base URL is missing', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/db';
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      delete process.env.API_BASE_URL;

      const fileConfig: Partial<ValidationConfig> = {
        api: {
          baseURL: '',
          timeout: 5000,
        },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(fileConfig));

      const cliOptions: CLIOptions = {};

      await expect(loadConfig(cliOptions)).rejects.toThrow('API base URL is required');
    });

    it('should throw error when database connection string is missing', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      delete process.env.DATABASE_URL;

      const cliOptions: CLIOptions = {};

      await expect(loadConfig(cliOptions)).rejects.toThrow('Database connection string is required');
    });

    it('should throw error when test credentials are missing', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/db';
      delete process.env.TEST_USERNAME;
      delete process.env.TEST_PASSWORD;

      const fileConfig: Partial<ValidationConfig> = {
        testCredentials: {
          username: '',
          password: '',
        },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(fileConfig));

      const cliOptions: CLIOptions = {};

      await expect(loadConfig(cliOptions)).rejects.toThrow('Test credentials (username and password) are required');
    });

    it('should handle missing Redis configuration gracefully', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/db';
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;

      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const cliOptions: CLIOptions = {};
      const config = await loadConfig(cliOptions);

      expect(config.redis).toBeUndefined();
    });

    it('should merge nested configuration objects correctly', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      
      const fileConfig: Partial<ValidationConfig> = {
        api: {
          baseURL: 'http://file.example.com',
          timeout: 8000,
        },
        autoFix: {
          enabled: true,
          createMissingPages: false,
          fixBrokenAPIs: true,
        },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(fileConfig));

      const cliOptions: CLIOptions = {};
      const config = await loadConfig(cliOptions);

      // Should merge nested objects, not replace them
      expect(config.api.baseURL).toBe('http://file.example.com');
      expect(config.api.timeout).toBe(8000);
      expect(config.autoFix.enabled).toBe(true);
      expect(config.autoFix.createMissingPages).toBe(false);
      expect(config.autoFix.fixBrokenAPIs).toBe(true);
    });

    it('should handle partial phase configuration from file', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      
      const fileConfig: Partial<ValidationConfig> = {
        phases: {
          frontendBackend: false,
          security: false,
        } as any,
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(fileConfig));

      const cliOptions: CLIOptions = {};
      const config = await loadConfig(cliOptions);

      // Specified phases should be updated
      expect(config.phases.frontendBackend).toBe(false);
      expect(config.phases.security).toBe(false);

      // Unspecified phases should keep defaults
      expect(config.phases.backendDatabase).toBe(true);
      expect(config.phases.realTime).toBe(true);
    });
  });

  describe('createConfigTemplate', () => {
    it('should create a configuration template file', async () => {
      const outputPath = './test-config.json';
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await createConfigTemplate(outputPath);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('"api"'),
        'utf-8'
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('"database"'),
        'utf-8'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(outputPath));

      consoleLogSpy.mockRestore();
    });

    it('should create template with all required fields', async () => {
      const outputPath = './test-config.json';
      let writtenContent = '';

      vi.mocked(fs.writeFile).mockImplementation(async (path, content) => {
        writtenContent = content as string;
      });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await createConfigTemplate(outputPath);

      const template = JSON.parse(writtenContent);

      expect(template).toHaveProperty('api');
      expect(template).toHaveProperty('database');
      expect(template).toHaveProperty('redis');
      expect(template).toHaveProperty('testCredentials');
      expect(template).toHaveProperty('autoFix');
      expect(template).toHaveProperty('output');
      expect(template).toHaveProperty('phases');

      expect(template.api).toHaveProperty('baseURL');
      expect(template.api).toHaveProperty('timeout');
      expect(template.database).toHaveProperty('connectionString');
      expect(template.testCredentials).toHaveProperty('username');
      expect(template.testCredentials).toHaveProperty('password');

      consoleLogSpy.mockRestore();
    });

    it('should create template with valid JSON format', async () => {
      const outputPath = './test-config.json';
      let writtenContent = '';

      vi.mocked(fs.writeFile).mockImplementation(async (path, content) => {
        writtenContent = content as string;
      });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await createConfigTemplate(outputPath);

      // Should not throw when parsing
      expect(() => JSON.parse(writtenContent)).not.toThrow();

      consoleLogSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty CLI options', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const cliOptions: CLIOptions = {};
      const config = await loadConfig(cliOptions);

      expect(config).toBeDefined();
      expect(config.api).toBeDefined();
      expect(config.database).toBeDefined();
    });

    it('should handle file read errors gracefully', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const cliOptions: CLIOptions = {};
      const config = await loadConfig(cliOptions);

      // Should fall back to defaults
      expect(config.api.baseURL).toBe('http://localhost:3000');
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle invalid phase names in CLI options', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const cliOptions: CLIOptions = {
        phases: ['invalidPhase', 'frontendBackend'],
      };

      const config = await loadConfig(cliOptions);

      // Should enable only valid phases
      expect(config.phases.frontendBackend).toBe(true);
      expect(config.phases.backendDatabase).toBe(false);
    });

    it('should handle Redis port as string in environment', async () => {
      process.env.DATABASE_URL = 'postgresql://test:pass@localhost:5432/test_db';
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = '6380';

      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const cliOptions: CLIOptions = {};
      const config = await loadConfig(cliOptions);

      expect(config.redis?.port).toBe(6380);
      expect(typeof config.redis?.port).toBe('number');
    });

    it('should handle multiple validation errors', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      delete process.env.API_BASE_URL;
      delete process.env.DATABASE_URL;
      delete process.env.TEST_USERNAME;

      const fileConfig: Partial<ValidationConfig> = {
        api: {
          baseURL: '',
          timeout: 5000,
        },
        database: {
          connectionString: '',
        },
        testCredentials: {
          username: '',
          password: '',
        },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(fileConfig));

      const cliOptions: CLIOptions = {};

      await expect(loadConfig(cliOptions)).rejects.toThrow('Configuration validation failed');
    });
  });
});
