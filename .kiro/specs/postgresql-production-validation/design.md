# Design Document: PostgreSQL Production Validation

## Overview

This design specifies a comprehensive validation system for the PostgreSQL database infrastructure supporting the Aban Remit Core Backend. The system validates database structure, connection management, logging infrastructure, and integration tracking to ensure production readiness.

The validation system follows the existing validation framework architecture, implementing a new `PostgreSQLProductionValidator` that integrates with the `ValidationOrchestrator`. The validator performs structural checks, connection pool validation, log table verification, and integration testing.

## Architecture

### Component Structure

```
src/validation/validators/
├── postgresql-production.ts          # Main validator implementation
├── postgresql-production.test.ts     # Property-based and unit tests
└── helpers/
    ├── schema-validator.ts            # Schema structure validation
    ├── connection-pool-validator.ts   # Connection pool testing
    ├── log-table-validator.ts         # Log table structure validation
    └── integration-validator.ts       # Integration logging validation
```

### Integration with Existing System

The PostgreSQL Production Validator integrates with the existing validation framework:

1. **ValidationOrchestrator**: Registers the new validator as a phase
2. **ValidationReport**: Extends to include PostgreSQL validation results
3. **CLI**: Adds `--phase=postgresqlProduction` option
4. **Config**: Adds PostgreSQL-specific configuration options

### Validation Flow

```
ValidationOrchestrator
  └─> PostgreSQLProductionValidator.execute()
        ├─> SchemaValidator.validateSchemas()
        ├─> ConnectionPoolValidator.validatePool()
        ├─> LogTableValidator.validateLogTables()
        ├─> IntegrationValidator.validateIntegrations()
        └─> Generate PhaseResult
```

## Components and Interfaces

### PostgreSQLProductionValidator

Main validator class that coordinates all PostgreSQL validation checks.

```typescript
interface PostgreSQLProductionValidator {
  execute(): Promise<PhaseResult>;
  validateSchemaArchitecture(): Promise<ValidationResult>;
  validateConnectionPool(): Promise<ValidationResult>;
  validateLogTables(): Promise<ValidationResult>;
  validateIndexes(): Promise<ValidationResult>;
  validateSystemAccounts(): Promise<ValidationResult>;
  validateLedgerIntegrity(): Promise<ValidationResult>;
  validateIdempotency(): Promise<ValidationResult>;
  validateSecurity(): Promise<ValidationResult>;
  generateProductionReadinessReport(): ProductionReadinessReport;
}
```

### SchemaValidator

Validates multi-schema architecture and table structure.

```typescript
interface SchemaValidator {
  validateSchemaExists(schemaName: string): Promise<boolean>;
  validateTableExists(schemaName: string, tableName: string): Promise<boolean>;
  validateColumnExists(schemaName: string, tableName: string, columnName: string): Promise<boolean>;
  validateColumnType(schemaName: string, tableName: string, columnName: string, expectedType: string): Promise<boolean>;
  validateConstraint(schemaName: string, tableName: string, constraintName: string, constraintType: string): Promise<boolean>;
  getSchemaStructure(schemaName: string): Promise<SchemaStructure>;
}

interface SchemaStructure {
  schemaName: string;
  tables: TableStructure[];
}

interface TableStructure {
  tableName: string;
  columns: ColumnDefinition[];
  constraints: ConstraintDefinition[];
  indexes: IndexDefinition[];
}

interface ColumnDefinition {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  defaultValue?: string;
}

interface ConstraintDefinition {
  constraintName: string;
  constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
}

interface IndexDefinition {
  indexName: string;
  columns: string[];
  isUnique: boolean;
}
```

### ConnectionPoolValidator

Validates connection pool configuration and performance.

```typescript
interface ConnectionPoolValidator {
  validatePoolConfiguration(): Promise<ValidationResult>;
  testConcurrentConnections(count: number): Promise<ValidationResult>;
  measureConnectionLatency(): Promise<number>;
  testConnectionRecovery(): Promise<ValidationResult>;
  testIdleConnectionTimeout(): Promise<ValidationResult>;
  validateConnectionString(): Promise<ValidationResult>;
}

interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalConnections: number;
  averageLatency: number;
  maxLatency: number;
}
```

### LogTableValidator

Validates log table structures for MPESA, Paystack, and SMS.

```typescript
interface LogTableValidator {
  validateMpesaLogTable(): Promise<ValidationResult>;
  validatePaystackLogTable(): Promise<ValidationResult>;
  validateSmsLogTable(): Promise<ValidationResult>;
  validateLogTableColumns(schemaName: string, tableName: string, requiredColumns: ColumnDefinition[]): Promise<ValidationResult>;
  validateUniqueConstraints(schemaName: string, tableName: string, columns: string[]): Promise<ValidationResult>;
  validateJsonbColumns(schemaName: string, tableName: string, columns: string[]): Promise<ValidationResult>;
}
```

### IntegrationValidator

Validates integration logging functionality.

```typescript
interface IntegrationValidator {
  testMpesaLogging(testPayload: MpesaCallback): Promise<ValidationResult>;
  testPaystackLogging(testPayload: PaystackWebhook): Promise<ValidationResult>;
  testSmsLogging(testPayload: SmsDelivery): Promise<ValidationResult>;
  testIdempotency(provider: 'mpesa' | 'paystack', reference: string): Promise<ValidationResult>;
  validateDuplicateRejection(provider: 'mpesa' | 'paystack', reference: string): Promise<ValidationResult>;
}

interface MpesaCallback {
  mpesaReceipt: string;
  phone: string;
  amount: number;
  rawPayload: Record<string, any>;
}

interface PaystackWebhook {
  paystackReference: string;
  email?: string;
  amount: number;
  currency: string;
  status: string;
  gatewayResponse?: string;
  rawPayload: Record<string, any>;
}

interface SmsDelivery {
  recipient: string;
  message: string;
  cost?: number;
  status: 'PENDING' | 'SENT' | 'FAILED';
  providerMessageId?: string;
  errorMessage?: string;
}
```

### ProductionReadinessReport

Comprehensive report of all validation results.

```typescript
interface ProductionReadinessReport {
  timestamp: string;
  productionReady: boolean;
  databaseInfo: DatabaseInfo;
  validationResults: {
    schemaArchitecture: ValidationResult;
    connectionPool: ValidationResult;
    logTables: ValidationResult;
    indexes: ValidationResult;
    systemAccounts: ValidationResult;
    ledgerIntegrity: ValidationResult;
    idempotency: ValidationResult;
    security: ValidationResult;
  };
  performanceMetrics: PerformanceMetrics;
  criticalIssues: Issue[];
  warnings: Issue[];
  recommendations: string[];
}

interface DatabaseInfo {
  host: string;
  port: number;
  database: string;
  user: string;
  version: string;
  schemas: string[];
}

interface PerformanceMetrics {
  connectionLatency: number;
  queryLatency: number;
  poolMetrics: ConnectionPoolMetrics;
}

interface Issue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  message: string;
  details?: any;
  recommendation?: string;
}
```

## Data Models

### Database Connection Configuration

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  connectionTimeout: number;
  pool: PoolConfig;
}

interface PoolConfig {
  min: number;              // Minimum connections (default: 2)
  max: number;              // Maximum connections (default: 50)
  idleTimeoutMillis: number; // Idle timeout (default: 600000 = 10 minutes)
  connectionTimeoutMillis: number; // Connection timeout (default: 30000 = 30 seconds)
  acquireTimeoutMillis: number; // Acquire timeout (default: 30000 = 30 seconds)
}
```

### Schema Validation Configuration

```typescript
interface SchemaValidationConfig {
  schemas: SchemaConfig[];
}

interface SchemaConfig {
  name: string;
  tables: TableConfig[];
}

interface TableConfig {
  name: string;
  requiredColumns: ColumnDefinition[];
  requiredConstraints: ConstraintDefinition[];
  requiredIndexes: IndexDefinition[];
}
```

### Expected Schema Structure

```typescript
const EXPECTED_SCHEMAS: SchemaValidationConfig = {
  schemas: [
    {
      name: 'auth',
      tables: [
        { name: 'users', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'otps', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'devices', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'token_blacklist', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] }
      ]
    },
    {
      name: 'core',
      tables: [
        { name: 'wallets', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'transactions', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'fee_configs', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'commission_configs', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'exchange_rates', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] }
      ]
    },
    {
      name: 'ledger',
      tables: [
        { name: 'entries', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] }
      ]
    },
    {
      name: 'audit',
      tables: [
        { name: 'entries', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'reconciliation_jobs', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'reconciliation_discrepancies', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] }
      ]
    },
    {
      name: 'services',
      tables: [
        { name: 'mpesa_logs', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'paystack_logs', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] },
        { name: 'sms_logs', requiredColumns: [...], requiredConstraints: [...], requiredIndexes: [...] }
      ]
    }
  ]
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies and consolidations:

**Redundancies Identified:**
1. Requirements 1.3-1.7 are all specific examples of 1.2 (schema table validation) - these will be tested as unit test examples, not separate properties
2. Requirements 3.4 and 11.2 both test mpesa_receipt unique constraint - consolidate into 3.4
3. Requirements 3.5 and 11.3 both test paystack_reference unique constraint - consolidate into 3.5
4. Requirements 4.6 and 11.7 both test idempotency_key index - consolidate into 4.6
5. Requirement 6.8 is covered by 3.4 (database constraint enforcement)
6. Requirement 7.8 is covered by 3.5 (database constraint enforcement)

**Properties to Combine:**
1. Requirements 6.1-6.7 (MPESA logging) can be combined into comprehensive MPESA logging properties
2. Requirements 7.1-7.7 (Paystack logging) can be combined into comprehensive Paystack logging properties
3. Requirements 8.1-8.8 (SMS logging) can be combined into comprehensive SMS logging properties
4. Requirements 10.1 and 10.2 both test ledger balance - combine into one comprehensive property

**Final Property Set:**
After reflection, we have the following unique, non-redundant properties:
- Schema validation property (1.1, 1.2)
- Connection pool validation properties (2.4, 2.5, 2.6)
- Log table structure properties (3.6, 3.7)
- System wallet properties (5.6, 5.7)
- MPESA integration properties (6.1-6.7 combined)
- Paystack integration properties (7.1-7.7 combined)
- SMS logging properties (8.1-8.8 combined)
- Ledger integrity properties (10.1-10.5, 10.8 combined)
- Idempotency properties (11.4-11.6, 11.8)
- Security properties (12.1-12.3, 12.6)
- Report generation properties (13.2, 13.3, 13.6)

### Correctness Properties

Property 1: All required schemas exist
*For any* database instance, all five required schemas (auth, core, ledger, audit, services) must exist
**Validates: Requirements 1.1**

Property 2: Schema tables are complete
*For any* schema in the expected schema configuration, all designated tables must exist in that schema
**Validates: Requirements 1.2**

Property 3: Connection pool validates connections
*For any* connection returned from the connection pool, it must be validated before being returned to the caller
**Validates: Requirements 2.4**

Property 4: Connection pool recovers from failures
*For any* lost connection in the pool, the pool must automatically attempt to reconnect
**Validates: Requirements 2.5**

Property 5: Connection pool logs metrics
*For any* connection pool operation, metrics (active, idle, waiting) must be logged
**Validates: Requirements 2.6**

Property 6: Raw payload columns use JSONB
*For any* log table (mpesa_logs, paystack_logs), the raw_payload column must use JSONB data type
**Validates: Requirements 3.6**

Property 7: Amount columns use correct precision
*For any* table with an amount column, it must use DECIMAL(19,2) data type
**Validates: Requirements 3.7**

Property 8: System wallets have correct type
*For all* system wallets (MPESA_SUSPENSE, PAYSTACK_SUSPENSE, AIRTIME_SUSPENSE, FEE_REVENUE, COMMISSION_EXPENSE), the type must equal SYSTEM
**Validates: Requirements 5.6**

Property 9: System wallets are active
*For all* system wallets, the state must equal ACTIVE
**Validates: Requirements 5.7**

Property 10: MPESA callback logging is complete
*For any* MPESA C2B callback, the system must extract mpesa_receipt, phone, and amount, store the complete raw_payload as JSONB, check for duplicates, reject duplicates, store created_at timestamp, and return the log entry ID
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**

Property 11: Paystack webhook logging is complete
*For any* Paystack webhook, the system must extract paystack_reference, email, amount, currency, status, and gateway_response, store the complete raw_payload as JSONB, check for duplicates, reject duplicates, default currency to KES if not provided, and return the log entry ID
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**

Property 12: SMS logging is complete
*For any* SMS sent, the system must log recipient, message content, initial status as PENDING, update status on confirmation, store cost with DECIMAL(10,4) precision if available, store provider_message_id if available, store error_message if failed, and store created_at timestamp
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8**

Property 13: Ledger entries are balanced
*For any* transaction, the sum of DEBIT entries must equal the sum of CREDIT entries in ledger.entries
**Validates: Requirements 10.1, 10.2**

Property 14: Ledger entries reference valid entities
*For all* ledger entries, they must reference valid transactions and valid wallets
**Validates: Requirements 10.3, 10.4**

Property 15: Ledger entry amounts are positive
*For all* ledger entries, the amount must be greater than zero
**Validates: Requirements 10.5**

Property 16: Wallet balances are correct
*For any* wallet, the calculated balance (SUM(CREDIT) - SUM(DEBIT)) from ledger entries must match the expected balance
**Validates: Requirements 10.8**

Property 17: Duplicate webhooks are rejected
*For any* webhook (MPESA or Paystack) with a duplicate reference, the system must reject it and not create a duplicate transaction
**Validates: Requirements 11.4**

Property 18: Duplicate webhooks return original transaction
*For any* duplicate webhook, the system must return a 200 OK response with the original transaction ID
**Validates: Requirements 11.5**

Property 19: Duplicate webhooks are logged
*For any* duplicate webhook attempt, it must be logged for monitoring purposes
**Validates: Requirements 11.6**

Property 20: Idempotency keys are unique
*For all* idempotency keys in core.transactions, they must be unique (no duplicates exist)
**Validates: Requirements 11.8**

Property 21: Database user has correct permissions
*For all* application schemas (auth, core, ledger, audit, services), the database user must have SELECT, INSERT, UPDATE, DELETE permissions
**Validates: Requirements 12.1**

Property 22: Database user lacks dangerous permissions
*For all* production tables, the database user must NOT have DROP or TRUNCATE permissions
**Validates: Requirements 12.2**

Property 23: Password hashes are properly hashed
*For all* password_hash values in auth.users, they must be properly hashed (bcrypt format)
**Validates: Requirements 12.3**

Property 24: Row-level security is configured
*For all* tables requiring row-level security, RLS policies must be configured
**Validates: Requirements 12.6**

Property 25: Validation report includes all requirement statuses
*For any* validation report, it must include pass/fail status for each requirement
**Validates: Requirements 13.2**

Property 26: Validation report includes error details
*For all* failures in the validation report, detailed error messages must be included
**Validates: Requirements 13.3**

Property 27: Validation report includes recommendations
*For all* identified issues in the validation report, recommendations for fixing must be included
**Validates: Requirements 13.6**

## Error Handling

### Connection Errors

**Connection Timeout**:
- Timeout after 30 seconds
- Return error with connection details (password redacted)
- Log error for monitoring
- Suggest checking network connectivity and database availability

**Authentication Failure**:
- Return error indicating authentication failed
- Redact password from error message
- Suggest checking DATABASE_URL credentials
- Log failed authentication attempt

**Database Not Found**:
- Return error indicating database does not exist
- Suggest checking database name in connection string
- Provide list of available databases if possible

### Validation Errors

**Schema Missing**:
- Report critical error with schema name
- List expected schemas vs found schemas
- Recommend running migration scripts
- Block production deployment

**Table Missing**:
- Report critical error with schema and table name
- List expected tables vs found tables
- Recommend running migration scripts
- Block production deployment

**Column Missing**:
- Report critical error with table and column name
- List expected columns vs found columns
- Recommend running migration scripts
- Block production deployment

**Constraint Missing**:
- Report critical error with constraint details
- Recommend adding constraint via migration
- Block production deployment if constraint is critical (UNIQUE, FOREIGN KEY)

**Index Missing**:
- Report warning with index details
- Recommend adding index for performance
- Allow production deployment with warning

### Integration Errors

**Duplicate Webhook**:
- Return 200 OK with original transaction ID
- Log duplicate attempt
- Do not create duplicate transaction
- Include duplicate detection in monitoring

**Invalid Payload**:
- Return 400 Bad Request
- Log invalid payload for debugging
- Include validation error details
- Do not store invalid data

**Database Write Failure**:
- Return 500 Internal Server Error
- Log error with full details
- Retry with exponential backoff (up to 3 attempts)
- Alert monitoring system

### Ledger Integrity Errors

**Unbalanced Transaction**:
- Report critical error with transaction ID
- Show DEBIT sum vs CREDIT sum
- Recommend manual investigation
- Block production deployment

**Orphaned Ledger Entry**:
- Report critical error with entry ID
- Show referenced transaction/wallet that doesn't exist
- Recommend data cleanup
- Block production deployment

**Negative Amount**:
- Report critical error with entry ID
- Show negative amount value
- Recommend data correction
- Block production deployment

## Testing Strategy

### Dual Testing Approach

The validation system uses both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**:
- Specific schema validation examples (auth, core, ledger, audit, services)
- Specific index validation examples
- Specific system account validation examples
- Connection pool configuration examples
- Error handling scenarios
- Report generation examples

**Property-Based Tests**:
- Schema completeness across all schemas
- Connection pool behavior across concurrent operations
- Log table structure validation across all log tables
- Integration logging across random payloads
- Ledger integrity across random transactions
- Idempotency across random webhook attempts
- Security permissions across all schemas
- Report generation across all validation results

### Property Test Configuration

All property-based tests will:
- Run minimum 100 iterations per test
- Use fast-check library for TypeScript
- Reference design document properties in test tags
- Tag format: **Feature: postgresql-production-validation, Property {number}: {property_text}**

### Test Organization

```
src/validation/validators/__tests__/
├── postgresql-production.test.ts           # Unit tests
├── postgresql-production.property.test.ts  # Property-based tests
└── fixtures/
    ├── valid-database.sql                  # Valid database structure
    ├── missing-schema.sql                  # Missing schema scenario
    ├── missing-table.sql                   # Missing table scenario
    └── invalid-constraints.sql             # Invalid constraints scenario
```

### Example Property Test

```typescript
import fc from 'fast-check';

// Feature: postgresql-production-validation, Property 10: MPESA callback logging is complete
test('Property 10: MPESA callback logging is complete', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        mpesaReceipt: fc.string({ minLength: 10, maxLength: 50 }),
        phone: fc.string({ minLength: 10, maxLength: 20 }),
        amount: fc.double({ min: 1, max: 1000000 }),
        rawPayload: fc.object()
      }),
      async (callback) => {
        // Test that all fields are extracted and stored correctly
        const result = await mpesaLogger.logCallback(callback);
        
        expect(result.mpesaReceipt).toBe(callback.mpesaReceipt);
        expect(result.phone).toBe(callback.phone);
        expect(result.amount).toBe(callback.amount);
        expect(result.rawPayload).toEqual(callback.rawPayload);
        expect(result.createdAt).toBeDefined();
        expect(result.id).toBeDefined();
        
        // Test duplicate rejection
        await expect(mpesaLogger.logCallback(callback)).rejects.toThrow('Duplicate');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will validate:
- End-to-end validation flow
- Database connection with real PostgreSQL instance
- Schema validation against actual database
- Integration logging with real database writes
- Report generation with actual validation results

### Performance Testing

Performance tests will measure:
- Connection pool latency under load
- Query performance for validation checks
- Report generation time
- Memory usage during validation

### Test Data Management

- Use Docker containers for test databases
- Reset database state between tests
- Use transactions for test isolation
- Clean up test data after each test
- Use fixtures for consistent test scenarios

## Implementation Notes

### Database Query Optimization

- Use prepared statements for repeated queries
- Batch validation queries where possible
- Use connection pooling for concurrent checks
- Cache schema metadata during validation run
- Use indexes for fast lookups

### Security Considerations

- Redact passwords from all error messages
- Redact passwords from all log messages
- Use parameterized queries to prevent SQL injection
- Validate all user inputs
- Use least-privilege database user for validation

### Monitoring and Observability

- Log all validation phases with timing
- Track validation success/failure rates
- Alert on critical validation failures
- Dashboard for validation metrics
- Historical validation reports

### Production Deployment Checklist

Before deploying to production, ensure:
1. All schemas exist and are complete
2. All required indexes are present
3. All system accounts are initialized
4. Connection pool is properly configured
5. All log tables have correct structure
6. Ledger integrity is validated
7. Idempotency constraints are in place
8. Security permissions are correct
9. SSL/TLS is enabled for connections
10. Validation report shows "PRODUCTION READY"
