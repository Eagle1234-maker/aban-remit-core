/**
 * PageCompletenessAuditor - Audits frontend routes and pages for completeness
 * 
 * Validates:
 * - User dashboard pages (Requirements 4.1)
 * - Agent dashboard pages (Requirements 4.2)
 * - Admin dashboard pages (Requirements 4.3)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PhaseResult, ValidationError, ValidationWarning } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AuditResult {
  requiredRoutes: string[];
  existingRoutes: string[];
  missingRoutes: string[];
}

export class PageCompletenessAuditor {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private frontendPath: string;

  // Required routes as per design.md
  private readonly USER_DASHBOARD_ROUTES = [
    '/dashboard',
    '/wallet',
    '/send',
    '/withdraw',
    '/load-wallet',
    '/airtime',
    '/exchange',
    '/transactions',
    '/statements',
    '/profile',
    '/security',
    '/kyc',
  ];

  private readonly AGENT_DASHBOARD_ROUTES = [
    '/agent',
    '/agent/deposit',
    '/agent/withdraw',
    '/agent/float',
    '/agent/commission',
    '/agent/transactions',
    '/agent/statements',
  ];

  private readonly ADMIN_DASHBOARD_ROUTES = [
    '/admin',
    '/admin/users',
    '/admin/kyc',
    '/admin/fees',
    '/admin/exchange-rates',
    '/admin/sms',
    '/admin/reports',
    '/admin/audit',
    '/admin/settings',
    '/admin/roles',
    '/admin/permissions',
    '/admin/system-health',
  ];

  constructor(frontendPath?: string) {
    // Default to ../../../frontend relative to backend/src/validation/validators
    this.frontendPath = frontendPath || path.resolve(__dirname, '../../../../frontend');
  }

  /**
   * Execute all page completeness audits
   */
  async execute(): Promise<PhaseResult> {
    this.errors = [];
    this.warnings = [];

    // Check if frontend directory exists
    if (!fs.existsSync(this.frontendPath)) {
      this.warnings.push({
        phase: 'pageCompleteness',
        message: `Frontend directory not found at ${this.frontendPath}`,
        suggestion: 'This is expected if frontend is in a separate repository. Skipping page completeness audit.',
      });

      return {
        phaseName: 'pageCompleteness',
        status: 'WARN',
        errors: this.errors,
        warnings: this.warnings,
        duration: 0,
      };
    }

    // Run audits
    await this.auditUserDashboard();
    await this.auditAgentDashboard();
    await this.auditAdminDashboard();

    const status = this.errors.length > 0 ? 'FAIL' : this.warnings.length > 0 ? 'WARN' : 'PASS';

    return {
      phaseName: 'pageCompleteness',
      status,
      errors: this.errors,
      warnings: this.warnings,
      duration: 0,
    };
  }

  /**
   * Audit user dashboard pages
   * Requirements: 4.1
   */
  async auditUserDashboard(): Promise<AuditResult> {
    const existingRoutes = await this.scanForRoutes(this.USER_DASHBOARD_ROUTES);
    const missingRoutes = this.USER_DASHBOARD_ROUTES.filter(
      route => !existingRoutes.includes(route)
    );

    if (missingRoutes.length > 0) {
      this.errors.push({
        phase: 'pageCompleteness',
        code: 'USER_DASHBOARD_INCOMPLETE',
        message: `Missing ${missingRoutes.length} user dashboard route(s)`,
        details: { missingRoutes },
        timestamp: new Date().toISOString(),
      });
    }

    return {
      requiredRoutes: this.USER_DASHBOARD_ROUTES,
      existingRoutes,
      missingRoutes,
    };
  }

  /**
   * Audit agent dashboard pages
   * Requirements: 4.2
   */
  async auditAgentDashboard(): Promise<AuditResult> {
    const existingRoutes = await this.scanForRoutes(this.AGENT_DASHBOARD_ROUTES);
    const missingRoutes = this.AGENT_DASHBOARD_ROUTES.filter(
      route => !existingRoutes.includes(route)
    );

    if (missingRoutes.length > 0) {
      this.errors.push({
        phase: 'pageCompleteness',
        code: 'AGENT_DASHBOARD_INCOMPLETE',
        message: `Missing ${missingRoutes.length} agent dashboard route(s)`,
        details: { missingRoutes },
        timestamp: new Date().toISOString(),
      });
    }

    return {
      requiredRoutes: this.AGENT_DASHBOARD_ROUTES,
      existingRoutes,
      missingRoutes,
    };
  }

  /**
   * Audit admin dashboard pages
   * Requirements: 4.3
   */
  async auditAdminDashboard(): Promise<AuditResult> {
    const existingRoutes = await this.scanForRoutes(this.ADMIN_DASHBOARD_ROUTES);
    const missingRoutes = this.ADMIN_DASHBOARD_ROUTES.filter(
      route => !existingRoutes.includes(route)
    );

    if (missingRoutes.length > 0) {
      this.errors.push({
        phase: 'pageCompleteness',
        code: 'ADMIN_DASHBOARD_INCOMPLETE',
        message: `Missing ${missingRoutes.length} admin dashboard route(s)`,
        details: { missingRoutes },
        timestamp: new Date().toISOString(),
      });
    }

    return {
      requiredRoutes: this.ADMIN_DASHBOARD_ROUTES,
      existingRoutes,
      missingRoutes,
    };
  }

  /**
   * Get all missing pages across all dashboards
   */
  getMissingPages(): string[] {
    const allMissing: string[] = [];

    // Extract missing routes from errors
    for (const error of this.errors) {
      if (error.details?.missingRoutes) {
        allMissing.push(...error.details.missingRoutes);
      }
    }

    return allMissing;
  }

  /**
   * Scan filesystem for page components matching the required routes
   */
  private async scanForRoutes(requiredRoutes: string[]): Promise<string[]> {
    const existingRoutes: string[] = [];

    try {
      // Common frontend directory structures
      const possiblePagesDirs = [
        path.join(this.frontendPath, 'src', 'pages'),
        path.join(this.frontendPath, 'pages'),
        path.join(this.frontendPath, 'src', 'app'),
        path.join(this.frontendPath, 'app'),
      ];

      // Find which pages directory exists
      let pagesDir: string | null = null;
      for (const dir of possiblePagesDirs) {
        if (fs.existsSync(dir)) {
          pagesDir = dir;
          break;
        }
      }

      if (!pagesDir) {
        this.warnings.push({
          phase: 'pageCompleteness',
          message: 'Could not find pages directory in frontend',
          suggestion: 'Expected one of: src/pages, pages, src/app, app',
        });
        return existingRoutes;
      }

      // Check each required route
      for (const route of requiredRoutes) {
        if (this.routeExists(pagesDir, route)) {
          existingRoutes.push(route);
        }
      }
    } catch (error) {
      this.warnings.push({
        phase: 'pageCompleteness',
        message: `Error scanning for routes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Verify frontend directory structure',
      });
    }

    return existingRoutes;
  }

  /**
   * Check if a route exists in the filesystem
   * Supports various file naming conventions:
   * - /dashboard -> dashboard.tsx, dashboard.jsx, dashboard/index.tsx, etc.
   * - /admin/users -> admin/users.tsx, admin/users/index.tsx, etc.
   */
  private routeExists(pagesDir: string, route: string): boolean {
    // Remove leading slash
    const routePath = route.startsWith('/') ? route.slice(1) : route;

    // Possible file extensions
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];

    // Possible file patterns
    const patterns = [
      // Direct file: dashboard.tsx
      ...extensions.map(ext => path.join(pagesDir, `${routePath}${ext}`)),
      // Index file: dashboard/index.tsx
      ...extensions.map(ext => path.join(pagesDir, routePath, `index${ext}`)),
      // Page file: dashboard/page.tsx (Next.js app router)
      ...extensions.map(ext => path.join(pagesDir, routePath, `page${ext}`)),
    ];

    // Check if any pattern exists
    return patterns.some(pattern => fs.existsSync(pattern));
  }
}
