# Exchange Rate API Integration

## Overview

The Aban Remit system now includes real-time currency conversion using the ExchangeRate-API service.

## Configuration

Add these environment variables to your `.env` file:

```env
EXCHANGE_RATE_API_KEY=6e90421765ab03889d5ea89d
EXCHANGE_RATE_API_URL=https://v6.exchangerate-api.com/v6
```

## Usage

### Basic Currency Conversion

```typescript
import { createExchangeRateService } from './services/exchange-rate';

const exchangeService = createExchangeRateService();

// Convert KES to USD
const result = await exchangeService.convertKEStoUSD(10000);
console.log(`${result.fromAmount} KES = ${result.toAmount} USD`);
// Output: 10000 KES = 69.00 USD

// Convert USD to KES
const result2 = await exchangeService.convertUSDtoKES(100);
console.log(`${result2.fromAmount} USD = ${result2.toAmount} KES`);
// Output: 100 USD = 14493.00 KES
```

### Get Exchange Rate

```typescript
const rate = await exchangeService.getExchangeRate('KES', 'USD');
console.log(`1 KES = ${rate.rate} USD`);
```

### Convert Any Currency

```typescript
const result = await exchangeService.convertCurrency(1000, 'KES', 'EUR');
console.log(`${result.fromAmount} ${result.fromCurrency} = ${result.toAmount} ${result.toCurrency}`);
```

### Get All Rates for a Currency

```typescript
const rates = await exchangeService.getAllRates('KES');
console.log(rates);
// { USD: 0.0069, EUR: 0.0063, GBP: 0.0054, ... }
```

## Features

- **Automatic Caching**: Exchange rates are cached for 1 hour to minimize API calls
- **Error Handling**: Comprehensive error handling with clear error messages
- **Type Safety**: Full TypeScript support with interfaces
- **Testing**: Complete test coverage with mocked API responses

## API Limits

The free tier of ExchangeRate-API provides:
- 1,500 requests per month
- Updates every 24 hours
- Access to 161 currencies

## Caching Strategy

To minimize API calls and stay within limits:
- Rates are cached for 1 hour after fetching
- Cache is instance-based (each service instance has its own cache)
- Cache can be manually cleared with `clearCache()`

## Error Handling

The service throws descriptive errors for:
- Missing API key configuration
- Invalid currency codes
- Network failures
- API errors

Example:
```typescript
try {
  const result = await exchangeService.convertCurrency(100, 'INVALID', 'USD');
} catch (error) {
  console.error(error.message);
  // "Failed to fetch exchange rate for INVALID/USD: Exchange rate API error: unsupported-code"
}
```

## Integration with Existing Services

The exchange rate service can be integrated with:
- **Wallet Service**: Display balances in multiple currencies
- **Transfer Service**: Calculate fees in different currencies
- **Reporting**: Generate reports with multi-currency support
- **Admin Dashboard**: Show exchange rates and conversion tools

## Next Steps

1. Add exchange rate display to wallet dashboard
2. Implement multi-currency wallet support
3. Add currency conversion to transfer flows
4. Create admin endpoint for viewing current rates
