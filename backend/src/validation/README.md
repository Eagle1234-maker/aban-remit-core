# System Readiness Validation Tool

Comprehensive automated validation and auditing tool for the ABAN REMIT system. This tool validates connectivity, functionality, completeness, and security across all system layers.

## Features

- **Frontend-Backend Connectivity**: Validates API connectivity, authentication, and protected routes
- **Backend-Database Connectivity**: Tests database connections and CRUD operations
- **Real-Time Functionality**: Validates WebSocket connections and real-time updates
- **Page Completeness Audit**: Checks for missing routes and pages
- **Security Validation**: Tests password hashing, token expiration, rate limiting, and more
- **Health Endpoint**: Validates system health monitoring
- **Architecture Validation**: Ensures proper project structure
- **Auto-Fix Capabilities**: Automatically repairs common issues like missing pages

## Installation

Dependencies are already installed as part of the backend project. The tool uses:

- `commander` - CLI argument parsing
- `chalk` - Colored console output
- `axios` - HTTP client for API testing
- `fs-extra` - Enhanced file system operations
- `glob` - File pattern matching
- `fast-check` - Property-based testing

## Quick Start

### 1. Create Configuration File

```bash
npm run validate:init
```

This creates a `validation.config.json` file with default settings.

### 2. Configure Settings

Edit `validation.config.json` to match your environment:

```json
{
  "api": {
    "baseURL": "http://localhost:3000",
    "timeout": 5000
  },
  "database": {
    "connectionString": "postgresql://user:password@localhost:5432/aban_remit"
  },
  "testCredentials": {
    "username": "test@example.com",
    "password": "TestPassword123!"
  }
}
```

### 3. Run Validation

```bash
# Run all validation phases
npm run validate

# Run with auto-fix enabled
npm run validate:fix

# Run for CI/CD pipeline
npm run validate:ci

# Run with verbose output
npm run validate -- --verbose
```

## CLI Commands

### `validate-system run`

Run system validation with various options:

```bash
# Basic usage
npx tsx src/validation/cli.ts run

# With custom config file
npx tsx src/validation/cli.ts run --config ./custom-config.json

# With custom output path
npx tsx src/validation/cli.ts run --output ./reports/validation.json

# Enable auto-fix
npx tsx src/validation/cli.ts run --auto-fix

# Verbose output
npx tsx src/validation/cli.ts run --verbose

# Run specific phases only
npx tsx src/validation/cli.ts run --phases frontendBackend backendDatabase
```

**Options:**
- `-c, --config <path>` - Path to configuration file
- `-o, --output <path>` - Path to output report file
- `-f, --auto-fix` - Enable auto-fix for detected issues
- `-v, --verbose` - Enable verbose output
- `-p, --phases <phases...>` - Specific phases to run (space-separated)

### `validate-system init`

Create a configuration file template:

```bash
# Create default config
npx tsx src/validation/cli.ts init

# Create config at custom location
npx tsx src/validation/cli.ts init --output ./config/validation.json
```

## Configuration

### Configuration Sources

Configuration is loaded from multiple sources with the following priority:

1. **CLI arguments** (highest priority)
2. **Environment variables**
3. **Configuration file**
4. **Default values** (lowest priority)

### Configuration File Structure

```json
{
  "api": {
    "baseURL": "http://localhost:3000",
    "timeout": 5000
  },
  "database": {
    "connectionString": "postgresql://user:password@localhost:5432/aban_remit"
  },
  "redis": {
    "host": "localhost",
    "port": 6379
  },
  "testCredentials": {
    "username": "test@example.com",
    "password": "TestPassword123!"
  },
  "autoFix": {
    "enabled": true,
    "createMissingPages": true,
    "fixBrokenAPIs": false
  },
  "output": {
    "filePath": "./validation-report.json",
    "format": "both"
  },
  "phases": {
    "frontendBackend": true,
    "backendDatabase": true,
    "realTime": true,
    "pageCompleteness": true,
    "security": true,
    "healthEndpoint": true,
    "architecture": true
  }
}
```

### Environment Variables

You can also configure the tool using environment variables:

- `API_BASE_URL` - API base URL
- `DATABASE_URL` - Database connection string
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `TEST_USERNAME` - Test user username
- `TEST_PASSWORD` - Test user password

## Validation Phases

### 1. Frontend-Backend Connectivity
- API connectivity check
- Authentication endpoint validation
- Protected route authorization
- Token storage and retrieval
- Health endpoint check

### 2. Backend-Database Connectivity
- Database connection validation
- CRUD operations (Create, Read, Update, Delete)
- Transaction atomicity
- Query performance

### 3. Real-Time Functionality
- Transaction list updates
- Role switching
- WebSocket connection (if applicable)
- Event propagation

### 4. Page Completeness Audit
- User dashboard routes (12 routes)
- Agent dashboard routes (7 routes)
- Admin dashboard routes (13 routes)
- Missing page detection

### 5. Security Validation
- Password hashing
- Token expiration
- Rate limiting
- Input sanitization
- SQL injection protection
- XSS protection
- CORS policy enforcement

### 6. Health Endpoint
- Endpoint existence
- Response structure
- Component status (server, database, Redis)

### 7. Architecture Validation
- Frontend structure
- Backend structure
- Database structure

## Output

### Validation Report

The tool generates a comprehensive JSON report:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "productionReady": true,
  "summary": {
    "totalPhases": 7,
    "passedPhases": 7,
    "failedPhases": 0,
    "warnings": 0
  },
  "phases": {
    "frontendBackend": {
      "status": "OK",
      "message": "All frontend-backend connectivity checks passed"
    },
    "backendDatabase": {
      "status": "OK",
      "message": "Database connectivity and operations validated"
    }
    // ... other phases
  },
  "missingPages": [],
  "errors": [],
  "warnings": [],
  "autoFixChanges": []
}
```

### Exit Codes

- `0` - All validation phases passed
- `1` - One or more validation phases failed

## Auto-Fix Capabilities

When auto-fix is enabled, the tool can automatically:

1. **Create missing pages** - Generate page components with appropriate layouts
2. **Register routes** - Add route definitions to routing configuration
3. **Add navigation links** - Update sidebar navigation
4. **Generate API hooks** - Create placeholder API client functions

All auto-fix changes are logged in the validation report.

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run System Validation
  run: npm run validate:ci
  working-directory: ./backend

- name: Upload Validation Report
  uses: actions/upload-artifact@v3
  with:
    name: validation-report
    path: backend/validation-report.json
```

### GitLab CI Example

```yaml
validate:
  script:
    - cd backend
    - npm run validate:ci
  artifacts:
    paths:
      - backend/validation-report.json
    expire_in: 1 week
```

## Troubleshooting

### Configuration Errors

If you see "Configuration validation failed", ensure:
- API base URL is set
- Database connection string is valid
- Test credentials are provided

### Connection Errors

If validation fails with connection errors:
- Verify the API server is running
- Check database credentials
- Ensure Redis is running (if configured)

### Permission Errors

If auto-fix fails with permission errors:
- Ensure write permissions for the project directory
- Run with appropriate user permissions

## Development

### Project Structure

```
backend/src/validation/
├── cli.ts              # CLI entry point
├── config-loader.ts    # Configuration management
├── types.ts            # TypeScript type definitions
└── README.md           # This file
```

### Adding Custom Validators

Future validators will be added to this directory following the established patterns.

## License

Part of the ABAN REMIT Core Backend project.
