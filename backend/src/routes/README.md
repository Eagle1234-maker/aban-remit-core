# API Routes

## Wallet Routes

### GET /wallet/lookup/:walletNumber

Look up wallet information by wallet number for transaction confirmation.

**Authentication**: Required (JWT Bearer token)

**Requirements**: 31.1, 31.7

**URL Parameters**:
- `walletNumber` (string, required): Wallet ID in format WLT7770001 or AGT8880001

**Request Headers**:
```
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "walletNumber": "WLT7770001",
    "fullName": "John Doe",
    "phoneMasked": "****5678",
    "status": "ACTIVE",
    "kycStatus": "VERIFIED"
  }
}
```

**Error Responses**:

- **400 Bad Request** - Invalid wallet number format:
```json
{
  "error": "Bad Request",
  "message": "Invalid wallet number format. Expected WLT7770001 or AGT8880001"
}
```

- **400 Bad Request** - Wallet is LOCKED (Requirement 31.4):
```json
{
  "error": "Bad Request",
  "message": "Wallet WLT7770001 is locked and cannot be used for transactions",
  "code": "LOCKED"
}
```

- **400 Bad Request** - Wallet is FROZEN (Requirement 31.5):
```json
{
  "error": "Bad Request",
  "message": "Wallet WLT7770001 is frozen and cannot receive transfers",
  "code": "FROZEN"
}
```

- **401 Unauthorized** - Missing or invalid authentication:
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization header"
}
```

- **404 Not Found** - Wallet does not exist (Requirement 31.7):
```json
{
  "error": "Not Found",
  "message": "Wallet WLT9999999 not found"
}
```

- **500 Internal Server Error** - Unexpected error:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to lookup wallet"
}
```

**Security Features**:
- Phone number masking: Only last 4 digits visible (Requirement 31.2)
- No exposure of full phone, email, or internal user ID (Requirement 31.3)
- Rejects lookups for LOCKED or FROZEN wallets (Requirements 31.4, 31.5)
- Uses indexed query on wallet_number for performance (Requirement 31.6)

**Example Usage**:

```bash
# Using curl
curl -X GET http://localhost:3000/wallet/lookup/WLT7770001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Using JavaScript fetch
const response = await fetch('http://localhost:3000/wallet/lookup/WLT7770001', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(data);
```

## Authentication

All API endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

**JWT Token Structure**:
```json
{
  "userId": "user-123",
  "role": "USER",
  "walletId": "WLT7770001",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Token Expiry**: 15 minutes (Requirement 1.6)

**Error Responses**:
- Missing token: 401 Unauthorized
- Invalid token: 401 Unauthorized
- Expired token: 401 Unauthorized with message "Token expired"

## Health Check

### GET /health

Check if the API server is running.

**Authentication**: Not required

**Success Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE" // Optional, for specific error types
}
```

**Common HTTP Status Codes**:
- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters or business logic error
- `401 Unauthorized` - Authentication required or failed
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Unexpected server error

## Testing

Run integration tests:
```bash
npm test -- src/routes/wallet.integration.test.ts
```

Run all tests:
```bash
npm test
```

## Environment Variables

Required environment variables:
- `JWT_SECRET` - Secret key for JWT token signing/verification
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
