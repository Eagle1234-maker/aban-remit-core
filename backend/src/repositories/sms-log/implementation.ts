/**
 * SMS Log Repository Implementation
 * 
 * Implements SMS logging and cost tracking operations.
 * Validates Requirements: 36.1, 36.5
 */

import { SMSLogRepository, SMSLog, SMSLogInput, DateRange, SMSCostReport } from './interface.js';

export class SMSLogRepositoryImpl implements SMSLogRepository {
  // In-memory storage for mock implementation
  // In production, this would use a real database
  private smsLogs: Map<string, SMSLog> = new Map();
  private idCounter = 1;

  /**
   * Create a new SMS log entry
   * @param input - SMS log data
   * @returns Created SMS log
   */
  async createLog(input: SMSLogInput): Promise<SMSLog> {
    const id = `sms-log-${this.idCounter++}`;
    
    const smsLog: SMSLog = {
      id,
      recipient: input.recipient,
      message: input.message,
      cost: input.cost,
      status: input.status,
      providerMessageId: input.providerMessageId,
      errorMessage: input.errorMessage,
      createdAt: new Date()
    };
    
    this.smsLogs.set(id, smsLog);
    
    console.log(`SMS log created: ${id}, recipient: ${input.recipient}, status: ${input.status}`);
    
    return smsLog;
  }

  /**
   * Update SMS log status
   * @param id - SMS log ID
   * @param status - New status
   * @param errorMessage - Error message if failed
   * @returns Updated SMS log
   */
  async updateStatus(id: string, status: 'SENT' | 'FAILED', errorMessage?: string): Promise<SMSLog> {
    const smsLog = this.smsLogs.get(id);
    
    if (!smsLog) {
      throw new Error(`SMS log not found: ${id}`);
    }
    
    smsLog.status = status;
    if (errorMessage) {
      smsLog.errorMessage = errorMessage;
    }
    
    this.smsLogs.set(id, smsLog);
    
    console.log(`SMS log updated: ${id}, status: ${status}`);
    
    return smsLog;
  }

  /**
   * Find SMS logs by date range
   * @param dateRange - Date range to search
   * @returns SMS logs within date range
   */
  async findByDateRange(dateRange: DateRange): Promise<SMSLog[]> {
    const logs = Array.from(this.smsLogs.values());
    
    return logs.filter(log => 
      log.createdAt >= dateRange.startDate && 
      log.createdAt <= dateRange.endDate
    );
  }

  /**
   * Find SMS logs by recipient
   * @param recipient - Recipient phone number
   * @returns SMS logs for recipient
   */
  async findByRecipient(recipient: string): Promise<SMSLog[]> {
    const logs = Array.from(this.smsLogs.values());
    
    return logs.filter(log => log.recipient === recipient);
  }

  /**
   * Generate SMS cost report for a date range
   * @param dateRange - Date range to generate report for
   * @returns SMS cost report with statistics
   */
  async generateCostReport(dateRange: DateRange): Promise<SMSCostReport> {
    const logs = await this.findByDateRange(dateRange);
    
    const totalMessages = logs.length;
    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const successfulMessages = logs.filter(log => log.status === 'SENT').length;
    const failedMessages = logs.filter(log => log.status === 'FAILED').length;
    const successRate = totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0;
    
    return {
      totalMessages,
      totalCost,
      successfulMessages,
      failedMessages,
      successRate,
      dateRange
    };
  }

  /**
   * Clear all SMS logs (for testing)
   */
  async clearAll(): Promise<void> {
    this.smsLogs.clear();
    this.idCounter = 1;
  }

  /**
   * Get all SMS logs (for testing)
   */
  async findAll(): Promise<SMSLog[]> {
    return Array.from(this.smsLogs.values());
  }
}