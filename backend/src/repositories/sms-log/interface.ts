/**
 * SMS Log Repository Interface
 * 
 * Handles SMS logging and cost tracking operations.
 * Validates Requirements: 36.1, 36.5
 */

export interface SMSLog {
  id: string;
  recipient: string;
  message: string;
  cost: number;
  status: 'SENT' | 'FAILED' | 'PENDING';
  providerMessageId?: string;
  errorMessage?: string;
  createdAt: Date;
}

export interface SMSLogInput {
  recipient: string;
  message: string;
  cost: number;
  status: 'SENT' | 'FAILED' | 'PENDING';
  providerMessageId?: string;
  errorMessage?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SMSCostReport {
  totalMessages: number;
  totalCost: number;
  successfulMessages: number;
  failedMessages: number;
  successRate: number;
  dateRange: DateRange;
}

export interface SMSLogRepository {
  createLog(input: SMSLogInput): Promise<SMSLog>;
  updateStatus(id: string, status: 'SENT' | 'FAILED', errorMessage?: string): Promise<SMSLog>;
  findByDateRange(dateRange: DateRange): Promise<SMSLog[]>;
  findByRecipient(recipient: string): Promise<SMSLog[]>;
  generateCostReport(dateRange: DateRange): Promise<SMSCostReport>;
}