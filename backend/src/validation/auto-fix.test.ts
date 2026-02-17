/**
 * Unit tests for AutoFixModule
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { AutoFixModule } from './auto-fix.js';

describe('AutoFixModule', () => {
  let autoFix: AutoFixModule;
  let testFrontendPath: string;
  let testPagesDir: string;

  beforeEach(() => {
    // Create temporary test directory
    testFrontendPath = path.join(__dirname, '__test_frontend__');
    testPagesDir = path.join(testFrontendPath, 'src', 'pages');

    // Create pages directory
    fs.mkdirSync(testPagesDir, { recursive: true });

    // Initialize AutoFixModule with test path
    autoFix = new AutoFixModule(testFrontendPath);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testFrontendPath)) {
      fs.rmSync(testFrontendPath, { recursive: true, force: true });
    }
  });

  describe('fixMissingPages', () => {
    it('should create a user dashboard page with correct template', async () => {
      const result = await autoFix.fixMissingPages(['/dashboard']);

      expect(result.success).toBe(true);
      expect(result.changesApplied).toHaveLength(1);
      expect(result.errors).toHaveLength(0);

      // Verify file was created
      const filePath = path.join(testPagesDir, 'dashboard.tsx');
      expect(fs.existsSync(filePath)).toBe(true);

      // Verify content
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('DashboardLayout');
      expect(content).toContain('export default function Dashboard()');
      expect(content).toContain('<h1 className="text-2xl font-bold mb-4">Dashboard</h1>');
    });

    it('should create an agent dashboard page with correct template', async () => {
      const result = await autoFix.fixMissingPages(['/agent/deposit']);

      expect(result.success).toBe(true);
      expect(result.changesApplied).toHaveLength(1);

      // Verify file was created
      const filePath = path.join(testPagesDir, 'agent', 'deposit', 'index.tsx');
      expect(fs.existsSync(filePath)).toBe(true);

      // Verify content
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('AgentLayout');
      expect(content).toContain('export default function AgentDeposit()');
      expect(content).toContain('<h1 className="text-2xl font-bold mb-4">Agent Deposit</h1>');
    });

    it('should create an admin dashboard page with correct template', async () => {
      const result = await autoFix.fixMissingPages(['/admin/users']);

      expect(result.success).toBe(true);
      expect(result.changesApplied).toHaveLength(1);

      // Verify file was created
      const filePath = path.join(testPagesDir, 'admin', 'users', 'index.tsx');
      expect(fs.existsSync(filePath)).toBe(true);

      // Verify content
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('AdminLayout');
      expect(content).toContain('export default function AdminUsers()');
      expect(content).toContain('<h1 className="text-2xl font-bold mb-4">Admin Users</h1>');
    });

    it('should handle hyphenated route names correctly', async () => {
      const result = await autoFix.fixMissingPages(['/load-wallet']);

      expect(result.success).toBe(true);

      // Verify file was created
      const filePath = path.join(testPagesDir, 'load-wallet.tsx');
      expect(fs.existsSync(filePath)).toBe(true);

      // Verify content
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('export default function LoadWallet()');
      expect(content).toContain('<h1 className="text-2xl font-bold mb-4">Load Wallet</h1>');
    });

    it('should create multiple pages in a single operation', async () => {
      const routes = ['/dashboard', '/wallet', '/send'];
      const result = await autoFix.fixMissingPages(routes);

      expect(result.success).toBe(true);
      expect(result.changesApplied).toHaveLength(3);
      expect(result.errors).toHaveLength(0);

      // Verify all files were created
      expect(fs.existsSync(path.join(testPagesDir, 'dashboard.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(testPagesDir, 'wallet.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(testPagesDir, 'send.tsx'))).toBe(true);
    });

    it('should create nested directories for nested routes', async () => {
      const result = await autoFix.fixMissingPages(['/admin/exchange-rates']);

      expect(result.success).toBe(true);

      // Verify nested directory structure
      const filePath = path.join(testPagesDir, 'admin', 'exchange-rates', 'index.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should handle errors gracefully when frontend directory does not exist', async () => {
      // Create AutoFixModule with non-existent path
      const invalidAutoFix = new AutoFixModule('/non/existent/path');
      const result = await invalidAutoFix.fixMissingPages(['/dashboard']);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Frontend directory not found');
    });

    it('should handle errors gracefully when pages directory does not exist', async () => {
      // Remove pages directory
      fs.rmSync(testPagesDir, { recursive: true, force: true });

      const result = await autoFix.fixMissingPages(['/dashboard']);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Could not find pages directory');
    });

    it('should continue creating pages even if one fails', async () => {
      // Create a file that will conflict with a directory we need to create
      const conflictPath = path.join(testPagesDir, 'admin');
      fs.writeFileSync(conflictPath, 'conflict', 'utf-8');

      const routes = ['/dashboard', '/admin/users', '/wallet'];
      const result = await autoFix.fixMissingPages(routes);

      // Should have created dashboard and wallet, but failed on admin/users
      expect(result.success).toBe(false);
      expect(result.changesApplied.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should log all changes made', async () => {
      const routes = ['/dashboard', '/wallet'];
      await autoFix.fixMissingPages(routes);

      const changeLog = autoFix.getChangeLog();
      expect(changeLog).toHaveLength(2);
      expect(changeLog[0].type).toBe('CREATE_FILE');
      expect(changeLog[0].description).toContain('Dashboard');
      expect(changeLog[1].type).toBe('CREATE_FILE');
      expect(changeLog[1].description).toContain('Wallet');
    });
  });

  describe('getChangeLog', () => {
    it('should return empty array initially', () => {
      const changeLog = autoFix.getChangeLog();
      expect(changeLog).toEqual([]);
    });

    it('should return all changes after fixMissingPages', async () => {
      await autoFix.fixMissingPages(['/dashboard', '/wallet', '/send']);

      const changeLog = autoFix.getChangeLog();
      expect(changeLog).toHaveLength(3);
      expect(changeLog.every(change => change.type === 'CREATE_FILE')).toBe(true);
    });

    it('should return a copy of the change log', async () => {
      await autoFix.fixMissingPages(['/dashboard']);

      const changeLog1 = autoFix.getChangeLog();
      const changeLog2 = autoFix.getChangeLog();

      expect(changeLog1).toEqual(changeLog2);
      expect(changeLog1).not.toBe(changeLog2); // Different array instances
    });
  });

  describe('template selection', () => {
    it('should use user template for root routes', async () => {
      await autoFix.fixMissingPages(['/dashboard']);

      const content = fs.readFileSync(path.join(testPagesDir, 'dashboard.tsx'), 'utf-8');
      expect(content).toContain('DashboardLayout');
    });

    it('should use agent template for /agent routes', async () => {
      await autoFix.fixMissingPages(['/agent']);

      const content = fs.readFileSync(path.join(testPagesDir, 'agent.tsx'), 'utf-8');
      expect(content).toContain('AgentLayout');
    });

    it('should use agent template for nested /agent routes', async () => {
      await autoFix.fixMissingPages(['/agent/transactions']);

      const content = fs.readFileSync(
        path.join(testPagesDir, 'agent', 'transactions', 'index.tsx'),
        'utf-8'
      );
      expect(content).toContain('AgentLayout');
    });

    it('should use admin template for /admin routes', async () => {
      await autoFix.fixMissingPages(['/admin']);

      const content = fs.readFileSync(path.join(testPagesDir, 'admin.tsx'), 'utf-8');
      expect(content).toContain('AdminLayout');
    });

    it('should use admin template for nested /admin routes', async () => {
      await autoFix.fixMissingPages(['/admin/system-health']);

      const content = fs.readFileSync(
        path.join(testPagesDir, 'admin', 'system-health', 'index.tsx'),
        'utf-8'
      );
      expect(content).toContain('AdminLayout');
    });
  });

  describe('page naming', () => {
    it('should convert simple routes to PascalCase component names', async () => {
      await autoFix.fixMissingPages(['/dashboard']);

      const content = fs.readFileSync(path.join(testPagesDir, 'dashboard.tsx'), 'utf-8');
      expect(content).toContain('export default function Dashboard()');
    });

    it('should convert nested routes to PascalCase component names', async () => {
      await autoFix.fixMissingPages(['/admin/users']);

      const content = fs.readFileSync(
        path.join(testPagesDir, 'admin', 'users', 'index.tsx'),
        'utf-8'
      );
      expect(content).toContain('export default function AdminUsers()');
    });

    it('should convert hyphenated routes to PascalCase component names', async () => {
      await autoFix.fixMissingPages(['/load-wallet']);

      const content = fs.readFileSync(path.join(testPagesDir, 'load-wallet.tsx'), 'utf-8');
      expect(content).toContain('export default function LoadWallet()');
    });

    it('should convert hyphenated nested routes to PascalCase component names', async () => {
      await autoFix.fixMissingPages(['/admin/exchange-rates']);

      const content = fs.readFileSync(
        path.join(testPagesDir, 'admin', 'exchange-rates', 'index.tsx'),
        'utf-8'
      );
      expect(content).toContain('export default function AdminExchangeRates()');
    });
  });

  describe('page titles', () => {
    it('should convert simple routes to readable titles', async () => {
      await autoFix.fixMissingPages(['/dashboard']);

      const content = fs.readFileSync(path.join(testPagesDir, 'dashboard.tsx'), 'utf-8');
      expect(content).toContain('<h1 className="text-2xl font-bold mb-4">Dashboard</h1>');
    });

    it('should convert nested routes to readable titles', async () => {
      await autoFix.fixMissingPages(['/admin/users']);

      const content = fs.readFileSync(
        path.join(testPagesDir, 'admin', 'users', 'index.tsx'),
        'utf-8'
      );
      expect(content).toContain('<h1 className="text-2xl font-bold mb-4">Admin Users</h1>');
    });

    it('should convert hyphenated routes to readable titles', async () => {
      await autoFix.fixMissingPages(['/load-wallet']);

      const content = fs.readFileSync(path.join(testPagesDir, 'load-wallet.tsx'), 'utf-8');
      expect(content).toContain('<h1 className="text-2xl font-bold mb-4">Load Wallet</h1>');
    });

    it('should convert hyphenated nested routes to readable titles', async () => {
      await autoFix.fixMissingPages(['/admin/exchange-rates']);

      const content = fs.readFileSync(
        path.join(testPagesDir, 'admin', 'exchange-rates', 'index.tsx'),
        'utf-8'
      );
      expect(content).toContain(
        '<h1 className="text-2xl font-bold mb-4">Admin Exchange Rates</h1>'
      );
    });
  });

  describe('file structure', () => {
    it('should create simple routes as direct files', async () => {
      await autoFix.fixMissingPages(['/dashboard']);

      expect(fs.existsSync(path.join(testPagesDir, 'dashboard.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(testPagesDir, 'dashboard', 'index.tsx'))).toBe(false);
    });

    it('should create nested routes as index files in directories', async () => {
      await autoFix.fixMissingPages(['/admin/users']);

      expect(fs.existsSync(path.join(testPagesDir, 'admin', 'users', 'index.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(testPagesDir, 'admin', 'users.tsx'))).toBe(false);
    });

    it('should handle all user dashboard routes', async () => {
      const userRoutes = [
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

      const result = await autoFix.fixMissingPages(userRoutes);

      expect(result.success).toBe(true);
      expect(result.changesApplied).toHaveLength(12);
    });

    it('should handle all agent dashboard routes', async () => {
      const agentRoutes = [
        '/agent',
        '/agent/deposit',
        '/agent/withdraw',
        '/agent/float',
        '/agent/commission',
        '/agent/transactions',
        '/agent/statements',
      ];

      const result = await autoFix.fixMissingPages(agentRoutes);

      expect(result.success).toBe(true);
      expect(result.changesApplied).toHaveLength(7);
    });

    it('should handle all admin dashboard routes', async () => {
      const adminRoutes = [
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

      const result = await autoFix.fixMissingPages(adminRoutes);

      expect(result.success).toBe(true);
      expect(result.changesApplied).toHaveLength(12);
    });
  });
});
