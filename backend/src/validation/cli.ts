#!/usr/bin/env node

/**
 * CLI Entry Point for System Readiness Validation Tool
 * 
 * This tool validates the ABAN REMIT system across all layers:
 * - Frontend-Backend connectivity
 * - Backend-Database connectivity
 * - Real-time functionality
 * - Page completeness
 * - Security controls
 * - Health endpoints
 * - Architecture validation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, createConfigTemplate } from './config-loader.js';
import { CLIOptions } from './types.js';

const program = new Command();

program
  .name('validate-system')
  .description('Comprehensive system readiness validation tool for ABAN REMIT')
  .version('1.0.0');

program
  .command('run')
  .description('Run system validation')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-o, --output <path>', 'Path to output report file')
  .option('-f, --auto-fix', 'Enable auto-fix for detected issues')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-p, --phases <phases...>', 'Specific phases to run (space-separated)')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n🔍 ABAN REMIT System Readiness Validation\n'));

      const cliOptions: CLIOptions = {
        configPath: options.config,
        outputPath: options.output,
        autoFix: options.autoFix,
        verbose: options.verbose,
        phases: options.phases,
      };

      // Load configuration
      if (options.verbose) {
        console.log(chalk.gray('Loading configuration...'));
      }
      const config = await loadConfig(cliOptions);

      if (options.verbose) {
        console.log(chalk.gray('Configuration loaded successfully'));
        console.log(chalk.gray(`API Base URL: ${config.api.baseURL}`));
        console.log(chalk.gray(`Auto-fix enabled: ${config.autoFix.enabled}`));
        console.log(chalk.gray(`Output path: ${config.output.filePath}\n`));
      }

      // Initialize validation orchestrator
      const { ValidationOrchestrator } = await import('./orchestrator.js');
      const { FrontendBackendValidator } = await import('./validators/frontend-backend.js');
      const { BackendDatabaseValidator } = await import('./validators/backend-database.js');
      const { RealTimeValidator } = await import('./validators/real-time.js');
      const { PageCompletenessAuditor } = await import('./validators/page-completeness.js');
      const { SecurityValidator } = await import('./validators/security.js');
      const { HealthEndpointValidator } = await import('./validators/health-endpoint.js');
      const { ArchitectureValidator } = await import('./validators/architecture.js');
      const { AutoFixModule } = await import('./auto-fix.js');
      const { ReportGenerator } = await import('./report-generator.js');

      const orchestrator = new ValidationOrchestrator();
      const reportGenerator = new ReportGenerator();

      // Register validators based on enabled phases
      if (config.phases.frontendBackend) {
        const frontendBackendValidator = new FrontendBackendValidator(
          config.api.baseURL,
          config.api.timeout,
          config.testCredentials
        );
        orchestrator.registerPhase({
          name: 'frontendBackend',
          execute: () => frontendBackendValidator.execute()
        });
      }

      if (config.phases.backendDatabase) {
        const backendDatabaseValidator = new BackendDatabaseValidator(
          config.database.connectionString
        );
        orchestrator.registerPhase({
          name: 'backendDatabase',
          execute: () => backendDatabaseValidator.execute()
        });
      }

      if (config.phases.realTime) {
        const realTimeValidator = new RealTimeValidator(
          config.api.baseURL,
          config.api.timeout,
          config.testCredentials
        );
        orchestrator.registerPhase({
          name: 'realTime',
          execute: () => realTimeValidator.execute()
        });
      }

      if (config.phases.pageCompleteness) {
        const pageCompletenessAuditor = new PageCompletenessAuditor();
        orchestrator.registerPhase({
          name: 'pageCompleteness',
          execute: async () => {
            const result = await pageCompletenessAuditor.execute();
            
            // If auto-fix is enabled and there are missing pages, fix them
            if (config.autoFix.enabled && config.autoFix.createMissingPages) {
              const missingPages = pageCompletenessAuditor.getMissingPages();
              if (missingPages.length > 0) {
                if (options.verbose) {
                  console.log(chalk.yellow(`\nAuto-fixing ${missingPages.length} missing pages...`));
                }
                
                const autoFix = new AutoFixModule();
                const fixResult = await autoFix.fixMissingPages(missingPages);
                
                if (options.verbose) {
                  console.log(chalk.green(`✓ Created ${fixResult.changesApplied.length} pages`));
                  if (fixResult.errors.length > 0) {
                    console.log(chalk.red(`✗ ${fixResult.errors.length} errors occurred`));
                  }
                }
              }
            }
            
            return result;
          }
        });
      }

      if (config.phases.security) {
        const securityValidator = new SecurityValidator(
          config.api.baseURL,
          config.api.timeout
        );
        orchestrator.registerPhase({
          name: 'security',
          execute: () => securityValidator.execute()
        });
      }

      if (config.phases.healthEndpoint) {
        const healthEndpointValidator = new HealthEndpointValidator(
          config.api.baseURL,
          config.api.timeout
        );
        orchestrator.registerPhase({
          name: 'healthEndpoint',
          execute: () => healthEndpointValidator.execute()
        });
      }

      if (config.phases.architecture) {
        const architectureValidator = new ArchitectureValidator();
        orchestrator.registerPhase({
          name: 'architecture',
          execute: () => architectureValidator.execute()
        });
      }

      if (options.verbose) {
        console.log(chalk.gray(`Registered ${orchestrator.getRegisteredPhases().length} validation phases\n`));
      }

      // Run validation
      console.log(chalk.blue('Running validation phases...\n'));
      const validationReport = await orchestrator.runAllPhases();

      // Generate and display report
      const report = reportGenerator.generateReport(
        [validationReport].flatMap(r => Object.values(r.phases).map((p: any) => ({
          phaseName: p.phaseName || 'unknown',
          status: p.status === 'OK' ? 'PASS' : p.status === 'FAIL' ? 'FAIL' : 'WARN',
          errors: validationReport.errors,
          warnings: validationReport.warnings,
          duration: 0
        })))
      );

      // Print to console
      reportGenerator.printToConsole(report, options.verbose);

      // Save to file if output path specified
      if (config.output.filePath) {
        reportGenerator.saveToFile(report, config.output.filePath);
        console.log(chalk.gray(`\nReport saved to: ${config.output.filePath}`));
      }

      // Exit with appropriate code
      process.exit(report.productionReady ? 0 : 1);
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Validation failed\n'));
      console.error(chalk.red((error as Error).message));
      if (options.verbose && error instanceof Error) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Create a configuration file template')
  .option('-o, --output <path>', 'Output path for config file', './validation.config.json')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n📝 Creating configuration template\n'));
      await createConfigTemplate(options.output);
      console.log(chalk.green('\n✓ Configuration template created successfully\n'));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Failed to create configuration template\n'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

// Parse command-line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
