/**
 * Airtime Log Repository Interface
 * 
 * Handles airtime transaction logging and tracking operations.
 * Validates Requirements: 7.5, 8.3
 */

export interface AirtimeLog {
  id: string;
  transactionReference: string;
  phone: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  providerResponse?: any;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AirtimeLogInput {
  transactionReference: string;
  phone: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  providerResponse?: any;
  errorMessage?: string;
}

export interface AirtimeLogUpdate {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  providerResponse?: any;
  errorMessage?: string;
  completedAt?: Date;
}

export interface AirtimeLogRepository {
  /**
   * Create a new airtime log entry
   */
  createLog(input: AirtimeLogInput): Promise<AirtimeLog>;
  
  /**
   * Update airtime log status
   */
  updateLog(transactionReference: string, update: AirtimeLogUpdate): Promise<AirtimeLog>;
  
  /**
   * Find airtime log by transaction reference
   */
  findByReference(transactionReference: string): Promise<AirtimeLog | null>;
  
  /**
   * Find airtime logs by phone number
   */
  findByPhone(phone: string): Promise<AirtimeLog[]>;
  
  /**
   * Find airtime logs by status
   */
  findByStatus(status: 'PENDING' | 'SUCCESS' | 'FAILED'): Promise<AirtimeLog[]>;
}
