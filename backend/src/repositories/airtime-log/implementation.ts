/**
 * Airtime Log Repository Implementation
 * 
 * Implements airtime transaction logging using Prisma.
 * Validates Requirements: 7.5, 8.3
 */

import { PrismaClient } from '@prisma/client';
import { AirtimeLogRepository, AirtimeLog, AirtimeLogInput, AirtimeLogUpdate } from './interface.js';

export class AirtimeLogRepositoryImpl implements AirtimeLogRepository {
  private prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  /**
   * Create a new airtime log entry
   */
  async createLog(input: AirtimeLogInput): Promise<AirtimeLog> {
    const log = await this.prisma.airtimeLog.create({
      data: {
        transactionReference: input.transactionReference,
        phone: input.phone,
        amount: input.amount,
        status: input.status,
        providerResponse: input.providerResponse || null,
        errorMessage: input.errorMessage || null,
        completedAt: input.status !== 'PENDING' ? new Date() : null
      }
    });
    
    return {
      id: log.id,
      transactionReference: log.transactionReference,
      phone: log.phone,
      amount: log.amount.toNumber(),
      status: log.status as 'PENDING' | 'SUCCESS' | 'FAILED',
      providerResponse: log.providerResponse,
      errorMessage: log.errorMessage || undefined,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      completedAt: log.completedAt || undefined
    };
  }
  
  /**
   * Update airtime log status
   */
  async updateLog(transactionReference: string, update: AirtimeLogUpdate): Promise<AirtimeLog> {
    const log = await this.prisma.airtimeLog.update({
      where: { transactionReference },
      data: {
        status: update.status,
        providerResponse: update.providerResponse || undefined,
        errorMessage: update.errorMessage || undefined,
        completedAt: update.completedAt || (update.status !== 'PENDING' ? new Date() : undefined),
        updatedAt: new Date()
      }
    });
    
    return {
      id: log.id,
      transactionReference: log.transactionReference,
      phone: log.phone,
      amount: log.amount.toNumber(),
      status: log.status as 'PENDING' | 'SUCCESS' | 'FAILED',
      providerResponse: log.providerResponse,
      errorMessage: log.errorMessage || undefined,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      completedAt: log.completedAt || undefined
    };
  }
  
  /**
   * Find airtime log by transaction reference
   */
  async findByReference(transactionReference: string): Promise<AirtimeLog | null> {
    const log = await this.prisma.airtimeLog.findUnique({
      where: { transactionReference }
    });
    
    if (!log) {
      return null;
    }
    
    return {
      id: log.id,
      transactionReference: log.transactionReference,
      phone: log.phone,
      amount: log.amount.toNumber(),
      status: log.status as 'PENDING' | 'SUCCESS' | 'FAILED',
      providerResponse: log.providerResponse,
      errorMessage: log.errorMessage || undefined,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      completedAt: log.completedAt || undefined
    };
  }
  
  /**
   * Find airtime logs by phone number
   */
  async findByPhone(phone: string): Promise<AirtimeLog[]> {
    const logs = await this.prisma.airtimeLog.findMany({
      where: { phone },
      orderBy: { createdAt: 'desc' }
    });
    
    return logs.map(log => ({
      id: log.id,
      transactionReference: log.transactionReference,
      phone: log.phone,
      amount: log.amount.toNumber(),
      status: log.status as 'PENDING' | 'SUCCESS' | 'FAILED',
      providerResponse: log.providerResponse,
      errorMessage: log.errorMessage || undefined,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      completedAt: log.completedAt || undefined
    }));
  }
  
  /**
   * Find airtime logs by status
   */
  async findByStatus(status: 'PENDING' | 'SUCCESS' | 'FAILED'): Promise<AirtimeLog[]> {
    const logs = await this.prisma.airtimeLog.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' }
    });
    
    return logs.map(log => ({
      id: log.id,
      transactionReference: log.transactionReference,
      phone: log.phone,
      amount: log.amount.toNumber(),
      status: log.status as 'PENDING' | 'SUCCESS' | 'FAILED',
      providerResponse: log.providerResponse,
      errorMessage: log.errorMessage || undefined,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      completedAt: log.completedAt || undefined
    }));
  }
}
