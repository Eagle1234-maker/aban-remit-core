import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExchangeRateService } from './exchange-rate';
import { httpClient } from '../utils/http-client.js';

// Mock the HTTP client
vi.mock('../utils/http-client.js', () => ({
  httpClient: {
    request: vi.fn(),
  },
}));

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;
  const originalEnv = process.env;

  beforeEach(() => {
    // Set up environment
    process.env = {
      ...originalEnv,
      EXCHANGE_RATE_API_KEY: 'test-api-key',
      EXCHANGE_RATE_API_URL: 'https://test-api.com/v6',
    };
    
    service = new ExchangeRateService();
    service.clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getExchangeRate', () => {
    it('should fetch exchange rate from API', async () => {
      const mockResponse = {
        result: 'success',
        time_last_update_utc: '2024-01-15T00:00:00Z',
        base_code: 'KES',
        target_code: 'USD',
        conversion_rate: 0.0069,
      };

      vi.mocked(httpClient.request).mockResolvedValue({
        status: 200,
        headers: {},
        data: mockResponse,
        duration: 100,
      });

      const result = await service.getExchangeRate('KES', 'USD');

      expect(result.baseCurrency).toBe('KES');
      expect(result.targetCurrency).toBe('USD');
      expect(result.rate).toBe(0.0069);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://test-api.com/v6/test-api-key/pair/KES/USD',
        timeout: 10000,
      });
    });

    it('should use cached rate if available and valid', async () => {
      const mockResponse = {
        result: 'success',
        time_last_update_utc: new Date().toISOString(), // Use current time
        base_code: 'KES',
        target_code: 'USD',
        conversion_rate: 0.0069,
      };

      vi.mocked(httpClient.request).mockResolvedValue({
        status: 200,
        headers: {},
        data: mockResponse,
        duration: 100,
      });

      // First call - should fetch from API
      const result1 = await service.getExchangeRate('KES', 'USD');
      expect(result1.rate).toBe(0.0069);
      const callCountAfterFirst = vi.mocked(httpClient.request).mock.calls.length;

      // Second call - should use cache
      const result2 = await service.getExchangeRate('KES', 'USD');
      expect(result2.rate).toBe(0.0069);
      const callCountAfterSecond = vi.mocked(httpClient.request).mock.calls.length;
      
      // Should not have made another API call
      expect(callCountAfterSecond).toBe(callCountAfterFirst);
    });

    it('should throw error if API returns error', async () => {
      const mockResponse = {
        result: 'error',
        'error-type': 'unsupported-code',
      };

      vi.mocked(httpClient.request).mockResolvedValue({
        status: 200,
        headers: {},
        data: mockResponse,
        duration: 100,
      });

      await expect(service.getExchangeRate('INVALID', 'USD')).rejects.toThrow(
        'Exchange rate API error'
      );
    });

    it('should throw error if HTTP request fails', async () => {
      vi.mocked(httpClient.request).mockRejectedValue(new Error('Network error'));

      await expect(service.getExchangeRate('KES', 'USD')).rejects.toThrow(
        'Failed to fetch exchange rate'
      );
    });
  });

  describe('convertCurrency', () => {
    it('should convert amount between currencies', async () => {
      const mockResponse = {
        result: 'success',
        time_last_update_utc: '2024-01-15T00:00:00Z',
        base_code: 'KES',
        target_code: 'USD',
        conversion_rate: 0.0069,
      };

      vi.mocked(httpClient.request).mockResolvedValue({
        status: 200,
        headers: {},
        data: mockResponse,
        duration: 100,
      });

      const result = await service.convertCurrency(1000, 'KES', 'USD');

      expect(result.fromCurrency).toBe('KES');
      expect(result.toCurrency).toBe('USD');
      expect(result.fromAmount).toBe(1000);
      expect(result.toAmount).toBe(6.9); // 1000 * 0.0069
      expect(result.rate).toBe(0.0069);
    });

    it('should return same amount if currencies are the same', async () => {
      const result = await service.convertCurrency(1000, 'KES', 'KES');

      expect(result.fromCurrency).toBe('KES');
      expect(result.toCurrency).toBe('KES');
      expect(result.fromAmount).toBe(1000);
      expect(result.toAmount).toBe(1000);
      expect(result.rate).toBe(1);
      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('should throw error for negative amount', async () => {
      await expect(service.convertCurrency(-100, 'KES', 'USD')).rejects.toThrow(
        'Amount must be positive'
      );
    });

    it('should round result to 2 decimal places', async () => {
      const mockResponse = {
        result: 'success',
        time_last_update_utc: '2024-01-15T00:00:00Z',
        base_code: 'KES',
        target_code: 'USD',
        conversion_rate: 0.006923,
      };

      vi.mocked(httpClient.request).mockResolvedValue({
        status: 200,
        headers: {},
        data: mockResponse,
        duration: 100,
      });

      const result = await service.convertCurrency(1000, 'KES', 'USD');

      expect(result.toAmount).toBe(6.92); // Rounded from 6.923
    });
  });

  describe('getAllRates', () => {
    it('should fetch all exchange rates for base currency', async () => {
      const mockResponse = {
        result: 'success',
        time_last_update_utc: '2024-01-15T00:00:00Z',
        base_code: 'KES',
        conversion_rates: {
          USD: 0.0069,
          EUR: 0.0063,
          GBP: 0.0054,
          KES: 1,
        },
      };

      vi.mocked(httpClient.request).mockResolvedValue({
        status: 200,
        headers: {},
        data: mockResponse,
        duration: 100,
      });

      const rates = await service.getAllRates('KES');

      expect(rates).toEqual({
        USD: 0.0069,
        EUR: 0.0063,
        GBP: 0.0054,
        KES: 1,
      });
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://test-api.com/v6/test-api-key/latest/KES',
        timeout: 10000,
      });
    });

    it('should throw error if API returns error', async () => {
      const mockResponse = {
        result: 'error',
        'error-type': 'unsupported-code',
      };

      vi.mocked(httpClient.request).mockResolvedValue({
        status: 200,
        headers: {},
        data: mockResponse,
        duration: 100,
      });

      await expect(service.getAllRates('INVALID')).rejects.toThrow(
        'Exchange rate API error'
      );
    });
  });

  describe('convertKEStoUSD', () => {
    it('should convert KES to USD', async () => {
      const mockResponse = {
        result: 'success',
        time_last_update_utc: '2024-01-15T00:00:00Z',
        base_code: 'KES',
        target_code: 'USD',
        conversion_rate: 0.0069,
      };

      vi.mocked(httpClient.request).mockResolvedValue({
        status: 200,
        headers: {},
        data: mockResponse,
        duration: 100,
      });

      const result = await service.convertKEStoUSD(1000);

      expect(result.fromCurrency).toBe('KES');
      expect(result.toCurrency).toBe('USD');
      expect(result.fromAmount).toBe(1000);
      expect(result.toAmount).toBe(6.9);
    });
  });

  describe('convertUSDtoKES', () => {
    it('should convert USD to KES', async () => {
      const mockResponse = {
        result: 'success',
        time_last_update_utc: '2024-01-15T00:00:00Z',
        base_code: 'USD',
        target_code: 'KES',
        conversion_rate: 144.93,
      };

      vi.mocked(httpClient.request).mockResolvedValue({
        status: 200,
        headers: {},
        data: mockResponse,
        duration: 100,
      });

      const result = await service.convertUSDtoKES(100);

      expect(result.fromCurrency).toBe('USD');
      expect(result.toCurrency).toBe('KES');
      expect(result.fromAmount).toBe(100);
      expect(result.toAmount).toBe(14493);
    });
  });

  describe('clearCache', () => {
    it('should clear the rate cache', async () => {
      const mockResponse = {
        result: 'success',
        time_last_update_utc: '2024-01-15T00:00:00Z',
        base_code: 'KES',
        target_code: 'USD',
        conversion_rate: 0.0069,
      };

      vi.mocked(httpClient.request).mockResolvedValue({
        status: 200,
        headers: {},
        data: mockResponse,
        duration: 100,
      });

      // First call
      await service.getExchangeRate('KES', 'USD');
      expect(httpClient.request).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Second call should fetch from API again
      await service.getExchangeRate('KES', 'USD');
      expect(httpClient.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      process.env.EXCHANGE_RATE_API_KEY = '';

      expect(() => new ExchangeRateService()).toThrow(
        'EXCHANGE_RATE_API_KEY environment variable is required'
      );
    });
  });
});
