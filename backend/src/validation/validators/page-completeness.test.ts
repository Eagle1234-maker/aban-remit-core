/**
 * Unit tests for PageCompletenessAuditor
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PageCompletenessAuditor } from './page-completeness.js';

describe('PageCompletenessAuditor', () => {
  let testFrontendDir: string;

  beforeEach(() => {
    // Create a temporary test frontend directory
    testFrontendDir = path.join(__dirname, '../../../../test-frontend-temp');
    if (!fs.existsSync(testFrontendDir)) {
      fs.mkdirSync(testFrontendDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testFrontendDir)) {
      fs.rmSync(testFrontendDir, { recursive: true, force: true });
    }
  });

  describe('Frontend directory handling', () => {
    it('should warn when frontend directory does not exist', async () => {
      const auditor = new PageCompletenessAuditor('/nonexistent/path');
      const result = await auditor.execute();

      expect(result.status).toBe('WARN');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('Frontend directory not found');
    });

    it('should warn when pages directory does not exist', async () => {
      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.execute();

      expect(result.warnings.some(w => w.message.includes('Could not find pages directory'))).toBe(true);
    });
  });

  describe('User dashboard audit', () => {
    it('should detect all 12 required user dashboard routes', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create all required user dashboard pages
      const userRoutes = [
        'dashboard.tsx',
        'wallet.tsx',
        'send.tsx',
        'withdraw.tsx',
        'load-wallet.tsx',
        'airtime.tsx',
        'exchange.tsx',
        'transactions.tsx',
        'statements.tsx',
        'profile.tsx',
        'security.tsx',
        'kyc.tsx',
      ];

      for (const route of userRoutes) {
        fs.writeFileSync(path.join(pagesDir, route), '// Test page');
      }

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.auditUserDashboard();

      expect(result.requiredRoutes.length).toBe(12);
      expect(result.existingRoutes.length).toBe(12);
      expect(result.missingRoutes.length).toBe(0);
    });

    it('should detect missing user dashboard routes', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create only some pages
      fs.writeFileSync(path.join(pagesDir, 'dashboard.tsx'), '// Test page');
      fs.writeFileSync(path.join(pagesDir, 'wallet.tsx'), '// Test page');

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.auditUserDashboard();

      expect(result.requiredRoutes.length).toBe(12);
      expect(result.existingRoutes.length).toBe(2);
      expect(result.missingRoutes.length).toBe(10);
      expect(result.missingRoutes).toContain('/send');
      expect(result.missingRoutes).toContain('/withdraw');
    });

    it('should support index file pattern', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create dashboard as directory with index file
      const dashboardDir = path.join(pagesDir, 'dashboard');
      fs.mkdirSync(dashboardDir, { recursive: true });
      fs.writeFileSync(path.join(dashboardDir, 'index.tsx'), '// Test page');

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.auditUserDashboard();

      expect(result.existingRoutes).toContain('/dashboard');
    });

    it('should support Next.js app router page pattern', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'app');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create dashboard as directory with page.tsx
      const dashboardDir = path.join(pagesDir, 'dashboard');
      fs.mkdirSync(dashboardDir, { recursive: true });
      fs.writeFileSync(path.join(dashboardDir, 'page.tsx'), '// Test page');

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.auditUserDashboard();

      expect(result.existingRoutes).toContain('/dashboard');
    });

    it('should support multiple file extensions', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create pages with different extensions
      fs.writeFileSync(path.join(pagesDir, 'dashboard.tsx'), '// TSX page');
      fs.writeFileSync(path.join(pagesDir, 'wallet.jsx'), '// JSX page');
      fs.writeFileSync(path.join(pagesDir, 'send.ts'), '// TS page');
      fs.writeFileSync(path.join(pagesDir, 'withdraw.js'), '// JS page');

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.auditUserDashboard();

      expect(result.existingRoutes).toContain('/dashboard');
      expect(result.existingRoutes).toContain('/wallet');
      expect(result.existingRoutes).toContain('/send');
      expect(result.existingRoutes).toContain('/withdraw');
    });
  });

  describe('Agent dashboard audit', () => {
    it('should detect all 7 required agent dashboard routes', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create agent directory and pages
      const agentDir = path.join(pagesDir, 'agent');
      fs.mkdirSync(agentDir, { recursive: true });

      fs.writeFileSync(path.join(agentDir, 'index.tsx'), '// Agent home');
      fs.writeFileSync(path.join(agentDir, 'deposit.tsx'), '// Deposit');
      fs.writeFileSync(path.join(agentDir, 'withdraw.tsx'), '// Withdraw');
      fs.writeFileSync(path.join(agentDir, 'float.tsx'), '// Float');
      fs.writeFileSync(path.join(agentDir, 'commission.tsx'), '// Commission');
      fs.writeFileSync(path.join(agentDir, 'transactions.tsx'), '// Transactions');
      fs.writeFileSync(path.join(agentDir, 'statements.tsx'), '// Statements');

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.auditAgentDashboard();

      expect(result.requiredRoutes.length).toBe(7);
      expect(result.existingRoutes.length).toBe(7);
      expect(result.missingRoutes.length).toBe(0);
    });

    it('should detect missing agent dashboard routes', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create agent directory with only some pages
      const agentDir = path.join(pagesDir, 'agent');
      fs.mkdirSync(agentDir, { recursive: true });
      fs.writeFileSync(path.join(agentDir, 'index.tsx'), '// Agent home');
      fs.writeFileSync(path.join(agentDir, 'deposit.tsx'), '// Deposit');

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.auditAgentDashboard();

      expect(result.requiredRoutes.length).toBe(7);
      expect(result.existingRoutes.length).toBe(2);
      expect(result.missingRoutes.length).toBe(5);
      expect(result.missingRoutes).toContain('/agent/withdraw');
      expect(result.missingRoutes).toContain('/agent/float');
    });
  });

  describe('Admin dashboard audit', () => {
    it('should detect all 12 required admin dashboard routes', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create admin directory and pages
      const adminDir = path.join(pagesDir, 'admin');
      fs.mkdirSync(adminDir, { recursive: true });

      fs.writeFileSync(path.join(adminDir, 'index.tsx'), '// Admin home');
      fs.writeFileSync(path.join(adminDir, 'users.tsx'), '// Users');
      fs.writeFileSync(path.join(adminDir, 'kyc.tsx'), '// KYC');
      fs.writeFileSync(path.join(adminDir, 'fees.tsx'), '// Fees');
      fs.writeFileSync(path.join(adminDir, 'exchange-rates.tsx'), '// Exchange rates');
      fs.writeFileSync(path.join(adminDir, 'sms.tsx'), '// SMS');
      fs.writeFileSync(path.join(adminDir, 'reports.tsx'), '// Reports');
      fs.writeFileSync(path.join(adminDir, 'audit.tsx'), '// Audit');
      fs.writeFileSync(path.join(adminDir, 'settings.tsx'), '// Settings');
      fs.writeFileSync(path.join(adminDir, 'roles.tsx'), '// Roles');
      fs.writeFileSync(path.join(adminDir, 'permissions.tsx'), '// Permissions');
      fs.writeFileSync(path.join(adminDir, 'system-health.tsx'), '// System health');

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.auditAdminDashboard();

      expect(result.requiredRoutes.length).toBe(12);
      expect(result.existingRoutes.length).toBe(12);
      expect(result.missingRoutes.length).toBe(0);
    });

    it('should detect missing admin dashboard routes', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create admin directory with only some pages
      const adminDir = path.join(pagesDir, 'admin');
      fs.mkdirSync(adminDir, { recursive: true });
      fs.writeFileSync(path.join(adminDir, 'index.tsx'), '// Admin home');
      fs.writeFileSync(path.join(adminDir, 'users.tsx'), '// Users');
      fs.writeFileSync(path.join(adminDir, 'kyc.tsx'), '// KYC');

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.auditAdminDashboard();

      expect(result.requiredRoutes.length).toBe(12);
      expect(result.existingRoutes.length).toBe(3);
      expect(result.missingRoutes.length).toBe(9);
      expect(result.missingRoutes).toContain('/admin/fees');
      expect(result.missingRoutes).toContain('/admin/system-health');
    });
  });

  describe('getMissingPages', () => {
    it('should return all missing pages across all dashboards', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create only dashboard page
      fs.writeFileSync(path.join(pagesDir, 'dashboard.tsx'), '// Dashboard');

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      await auditor.execute();

      const missingPages = auditor.getMissingPages();

      // Should have missing pages from all three dashboards
      expect(missingPages.length).toBeGreaterThan(0);
      expect(missingPages).toContain('/wallet');
      expect(missingPages).toContain('/agent');
      expect(missingPages).toContain('/admin');
    });

    it('should return empty array when all pages exist', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create all user dashboard pages
      const userRoutes = [
        'dashboard.tsx', 'wallet.tsx', 'send.tsx', 'withdraw.tsx',
        'load-wallet.tsx', 'airtime.tsx', 'exchange.tsx', 'transactions.tsx',
        'statements.tsx', 'profile.tsx', 'security.tsx', 'kyc.tsx',
      ];
      for (const route of userRoutes) {
        fs.writeFileSync(path.join(pagesDir, route), '// Page');
      }

      // Create all agent dashboard pages
      const agentDir = path.join(pagesDir, 'agent');
      fs.mkdirSync(agentDir, { recursive: true });
      const agentRoutes = [
        'index.tsx', 'deposit.tsx', 'withdraw.tsx', 'float.tsx',
        'commission.tsx', 'transactions.tsx', 'statements.tsx',
      ];
      for (const route of agentRoutes) {
        fs.writeFileSync(path.join(agentDir, route), '// Page');
      }

      // Create all admin dashboard pages
      const adminDir = path.join(pagesDir, 'admin');
      fs.mkdirSync(adminDir, { recursive: true });
      const adminRoutes = [
        'index.tsx', 'users.tsx', 'kyc.tsx', 'fees.tsx', 'exchange-rates.tsx',
        'sms.tsx', 'reports.tsx', 'audit.tsx', 'settings.tsx', 'roles.tsx',
        'permissions.tsx', 'system-health.tsx',
      ];
      for (const route of adminRoutes) {
        fs.writeFileSync(path.join(adminDir, route), '// Page');
      }

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      await auditor.execute();

      const missingPages = auditor.getMissingPages();
      expect(missingPages.length).toBe(0);
    });
  });

  describe('execute', () => {
    it('should return PASS status when all pages exist', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create all required pages
      const userRoutes = [
        'dashboard.tsx', 'wallet.tsx', 'send.tsx', 'withdraw.tsx',
        'load-wallet.tsx', 'airtime.tsx', 'exchange.tsx', 'transactions.tsx',
        'statements.tsx', 'profile.tsx', 'security.tsx', 'kyc.tsx',
      ];
      for (const route of userRoutes) {
        fs.writeFileSync(path.join(pagesDir, route), '// Page');
      }

      const agentDir = path.join(pagesDir, 'agent');
      fs.mkdirSync(agentDir, { recursive: true });
      const agentRoutes = [
        'index.tsx', 'deposit.tsx', 'withdraw.tsx', 'float.tsx',
        'commission.tsx', 'transactions.tsx', 'statements.tsx',
      ];
      for (const route of agentRoutes) {
        fs.writeFileSync(path.join(agentDir, route), '// Page');
      }

      const adminDir = path.join(pagesDir, 'admin');
      fs.mkdirSync(adminDir, { recursive: true });
      const adminRoutes = [
        'index.tsx', 'users.tsx', 'kyc.tsx', 'fees.tsx', 'exchange-rates.tsx',
        'sms.tsx', 'reports.tsx', 'audit.tsx', 'settings.tsx', 'roles.tsx',
        'permissions.tsx', 'system-health.tsx',
      ];
      for (const route of adminRoutes) {
        fs.writeFileSync(path.join(adminDir, route), '// Page');
      }

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.execute();

      expect(result.status).toBe('PASS');
      expect(result.errors.length).toBe(0);
    });

    it('should return FAIL status when pages are missing', async () => {
      const pagesDir = path.join(testFrontendDir, 'src', 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });

      // Create only one page
      fs.writeFileSync(path.join(pagesDir, 'dashboard.tsx'), '// Dashboard');

      const auditor = new PageCompletenessAuditor(testFrontendDir);
      const result = await auditor.execute();

      expect(result.status).toBe('FAIL');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return WARN status when frontend directory does not exist', async () => {
      const auditor = new PageCompletenessAuditor('/nonexistent/path');
      const result = await auditor.execute();

      expect(result.status).toBe('WARN');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });
  });
});
