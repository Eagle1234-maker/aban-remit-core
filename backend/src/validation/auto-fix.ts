/**
 * AutoFixModule - Automatically repairs common issues
 * 
 * Validates:
 * - Auto-fix missing routes (Requirements 4.4, 4.5, 4.6, 4.7, 10.1, 10.2, 10.5)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { AutoFixChange, AutoFixError } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AutoFixResult {
  success: boolean;
  changesApplied: AutoFixChange[];
  errors: AutoFixError[];
}

export class AutoFixModule {
  private changeLog: AutoFixChange[] = [];
  private errors: AutoFixError[] = [];
  private frontendPath: string;

  // Page templates from design.md
  private readonly USER_PAGE_TEMPLATE = `import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function {{PageName}}() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{{PageTitle}}</h1>
        <p>This page is under construction.</p>
      </div>
    </DashboardLayout>
  );
}
`;

  private readonly AGENT_PAGE_TEMPLATE = `import { AgentLayout } from '@/components/layouts/AgentLayout';

export default function {{PageName}}() {
  return (
    <AgentLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{{PageTitle}}</h1>
        <p>This page is under construction.</p>
      </div>
    </AgentLayout>
  );
}
`;

  private readonly ADMIN_PAGE_TEMPLATE = `import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function {{PageName}}() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{{PageTitle}}</h1>
        <p>This page is under construction.</p>
      </div>
    </AdminLayout>
  );
}
`;

  constructor(frontendPath?: string) {
    // Default to ../../../frontend relative to backend/src/validation
    this.frontendPath = frontendPath || path.resolve(__dirname, '../../../frontend');
  }

  /**
   * Fix missing pages by creating page files from templates
   * Requirements: 4.4, 4.5, 4.6, 4.7, 10.1, 10.2
   */
  async fixMissingPages(missingRoutes: string[]): Promise<AutoFixResult> {
    this.changeLog = [];
    this.errors = [];

    // Check if frontend directory exists
    if (!fs.existsSync(this.frontendPath)) {
      this.errors.push({
        operation: 'fixMissingPages',
        path: this.frontendPath,
        error: 'Frontend directory not found. Cannot create pages.',
      });

      return {
        success: false,
        changesApplied: this.changeLog,
        errors: this.errors,
      };
    }

    // Find pages directory
    const pagesDir = this.findPagesDirectory();
    if (!pagesDir) {
      this.errors.push({
        operation: 'fixMissingPages',
        path: this.frontendPath,
        error: 'Could not find pages directory. Expected one of: src/pages, pages, src/app, app',
      });

      return {
        success: false,
        changesApplied: this.changeLog,
        errors: this.errors,
      };
    }

    // Create each missing page
    for (const route of missingRoutes) {
      try {
        await this.createPage(pagesDir, route);
      } catch (error) {
        // Log error but continue with other pages
        this.errors.push({
          operation: 'createPage',
          path: route,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: this.errors.length === 0,
      changesApplied: this.changeLog,
      errors: this.errors,
    };
  }

  /**
   * Get the change log of all operations performed
   * Requirements: 10.5
   */
  getChangeLog(): AutoFixChange[] {
    return [...this.changeLog];
  }

  /**
   * Find the pages directory in the frontend
   */
  private findPagesDirectory(): string | null {
    const possiblePagesDirs = [
      path.join(this.frontendPath, 'src', 'pages'),
      path.join(this.frontendPath, 'pages'),
      path.join(this.frontendPath, 'src', 'app'),
      path.join(this.frontendPath, 'app'),
    ];

    for (const dir of possiblePagesDirs) {
      if (fs.existsSync(dir)) {
        return dir;
      }
    }

    return null;
  }

  /**
   * Create a page file from template
   * Requirements: 4.4, 10.1, 10.2
   */
  private async createPage(pagesDir: string, route: string): Promise<void> {
    // Remove leading slash
    const routePath = route.startsWith('/') ? route.slice(1) : route;

    // Determine dashboard type and select template
    const template = this.selectTemplate(route);
    const pageName = this.routeToPageName(route);
    const pageTitle = this.routeToPageTitle(route);

    // Generate page content
    const pageContent = template
      .replace(/\{\{PageName\}\}/g, pageName)
      .replace(/\{\{PageTitle\}\}/g, pageTitle);

    // Determine file path (use index.tsx for nested routes)
    const isNestedRoute = routePath.includes('/');
    const filePath = isNestedRoute
      ? path.join(pagesDir, routePath, 'index.tsx')
      : path.join(pagesDir, `${routePath}.tsx`);

    // Create directory if needed
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    // Write page file
    fs.writeFileSync(filePath, pageContent, 'utf-8');

    // Log change
    this.changeLog.push({
      type: 'CREATE_FILE',
      path: filePath,
      description: `Created ${pageName} page for route ${route}`,
    });
  }

  /**
   * Select appropriate template based on route
   * Requirements: 10.2
   */
  private selectTemplate(route: string): string {
    if (route.startsWith('/agent')) {
      return this.AGENT_PAGE_TEMPLATE;
    } else if (route.startsWith('/admin')) {
      return this.ADMIN_PAGE_TEMPLATE;
    } else {
      return this.USER_PAGE_TEMPLATE;
    }
  }

  /**
   * Convert route to component name
   * Examples:
   * - /dashboard -> Dashboard
   * - /admin/users -> AdminUsers
   * - /agent/deposit -> AgentDeposit
   * - /load-wallet -> LoadWallet
   */
  private routeToPageName(route: string): string {
    // Remove leading slash and split by slash
    const parts = route.replace(/^\//, '').split('/');

    // Capitalize each part (handling hyphens) and join
    return parts
      .map(part => {
        // Split by hyphen, capitalize each word, and join
        return part
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
      })
      .join('');
  }

  /**
   * Convert route to human-readable title
   * Examples:
   * - /dashboard -> Dashboard
   * - /admin/users -> Admin Users
   * - /load-wallet -> Load Wallet
   */
  private routeToPageTitle(route: string): string {
    // Remove leading slash and split by slash
    const parts = route.replace(/^\//, '').split('/');

    // Convert each part to title case and handle hyphens
    return parts
      .map(part => {
        // Replace hyphens with spaces
        const words = part.split('-');
        // Capitalize each word
        return words
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      })
      .join(' ');
  }
}
