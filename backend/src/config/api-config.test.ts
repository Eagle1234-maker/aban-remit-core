import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadAPIConfig, validateAPIConfig, ConfigurationError } from './api-config';

describe('API Configuration Loader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadAPIConfig', () => {
    it('should load all configurations when all required variables are set', () => {
      // Set all required environment variables
      process.env.MPESA_CONSUMER_KEY = 'test-mpesa-key';
      process.env.MPESA_CONSUMER_SECRET = 'test-mpesa-secret';
      process.env.MPESA_SHORTCODE = '000772';
      process.env.MPESA_PASSKEY = 'test-passkey';
      process.env.MPESA_CALLBACK_URL = 'https://test.com/callback';

      process.env.TALKSASA_API_TOKEN = 'test-talksasa-token';
      process.env.TALKSASA_SENDER_ID = 'TEST_SENDER';

      process.env.INSTALIPA_CONSUMER_KEY = 'test-instalipa-key';
      process.env.INSTALIPA_CONSUMER_SECRET = 'test-instalipa-secret';
      process.env.INSTALIPA_CALLBACK_URL = 'https://test.com/airtime-callback';

      const config = loadAPIConfig();

      expect(config.mpesa.consumerKey).toBe('test-mpesa-key');
      expect(config.mpesa.consumerSecret).toBe('test-mpesa-secret');
      expect(config.mpesa.shortcode).toBe('000772');
      expect(config.mpesa.passkey).toBe('test-passkey');
      expect(config.mpesa.callbackUrl).toBe('https://test.com/callback');
      expect(config.mpesa.apiUrl).toBe('https://api.safaricom.co.ke');
      expect(config.mpesa.timeout).toBe(30000);

      expect(config.talkSasa.apiToken).toBe('test-talksasa-token');
      expect(config.talkSasa.senderId).toBe('TEST_SENDER');
      expect(config.talkSasa.apiUrl).toBe('https://bulksms.talksasa.com/api/v3');
      expect(config.talkSasa.timeout).toBe(15000);

      expect(config.instalipa.consumerKey).toBe('test-instalipa-key');
      expect(config.instalipa.consumerSecret).toBe('test-instalipa-secret');
      expect(config.instalipa.callbackUrl).toBe('https://test.com/airtime-callback');
      expect(config.instalipa.apiUrl).toBe('https://api.instalipa.com');
      expect(config.instalipa.timeout).toBe(30000);
    });

    it('should use custom API URLs and timeouts when provided', () => {
      // Set required variables
      process.env.MPESA_CONSUMER_KEY = 'test-key';
      process.env.MPESA_CONSUMER_SECRET = 'test-secret';
      process.env.MPESA_SHORTCODE = '000772';
      process.env.MPESA_PASSKEY = 'test-passkey';
      process.env.MPESA_CALLBACK_URL = 'https://test.com/callback';
      process.env.MPESA_API_URL = 'https://custom-mpesa.com';
      process.env.MPESA_TIMEOUT = '60000';

      process.env.TALKSASA_API_TOKEN = 'test-token';
      process.env.TALKSASA_SENDER_ID = 'TEST';
      process.env.TALKSASA_API_URL = 'https://custom-sms.com';
      process.env.TALKSASA_TIMEOUT = '20000';

      process.env.INSTALIPA_CONSUMER_KEY = 'test-key';
      process.env.INSTALIPA_CONSUMER_SECRET = 'test-secret';
      process.env.INSTALIPA_CALLBACK_URL = 'https://test.com/callback';
      process.env.INSTALIPA_API_URL = 'https://custom-airtime.com';
      process.env.INSTALIPA_TIMEOUT = '45000';

      const config = loadAPIConfig();

      expect(config.mpesa.apiUrl).toBe('https://custom-mpesa.com');
      expect(config.mpesa.timeout).toBe(60000);
      expect(config.talkSasa.apiUrl).toBe('https://custom-sms.com');
      expect(config.talkSasa.timeout).toBe(20000);
      expect(config.instalipa.apiUrl).toBe('https://custom-airtime.com');
      expect(config.instalipa.timeout).toBe(45000);
    });

    it('should throw ConfigurationError when MPESA_CONSUMER_KEY is missing', () => {
      process.env.MPESA_CONSUMER_SECRET = 'test-secret';
      process.env.MPESA_SHORTCODE = '000772';
      process.env.MPESA_PASSKEY = 'test-passkey';
      process.env.MPESA_CALLBACK_URL = 'https://test.com/callback';
      process.env.TALKSASA_API_TOKEN = 'test-token';
      process.env.TALKSASA_SENDER_ID = 'TEST';
      process.env.INSTALIPA_CONSUMER_KEY = 'test-key';
      process.env.INSTALIPA_CONSUMER_SECRET = 'test-secret';
      process.env.INSTALIPA_CALLBACK_URL = 'https://test.com/callback';

      expect(() => loadAPIConfig()).toThrow(ConfigurationError);
      expect(() => loadAPIConfig()).toThrow('MPESA_CONSUMER_KEY');
    });

    it('should throw ConfigurationError when MPESA_CONSUMER_SECRET is missing', () => {
      process.env.MPESA_CONSUMER_KEY = 'test-key';
      process.env.MPESA_SHORTCODE = '000772';
      process.env.MPESA_PASSKEY = 'test-passkey';
      process.env.MPESA_CALLBACK_URL = 'https://test.com/callback';
      process.env.TALKSASA_API_TOKEN = 'test-token';
      process.env.TALKSASA_SENDER_ID = 'TEST';
      process.env.INSTALIPA_CONSUMER_KEY = 'test-key';
      process.env.INSTALIPA_CONSUMER_SECRET = 'test-secret';
      process.env.INSTALIPA_CALLBACK_URL = 'https://test.com/callback';

      expect(() => loadAPIConfig()).toThrow(ConfigurationError);
      expect(() => loadAPIConfig()).toThrow('MPESA_CONSUMER_SECRET');
    });

    it('should throw ConfigurationError when TALKSASA_API_TOKEN is missing', () => {
      process.env.MPESA_CONSUMER_KEY = 'test-key';
      process.env.MPESA_CONSUMER_SECRET = 'test-secret';
      process.env.MPESA_SHORTCODE = '000772';
      process.env.MPESA_PASSKEY = 'test-passkey';
      process.env.MPESA_CALLBACK_URL = 'https://test.com/callback';
      process.env.TALKSASA_SENDER_ID = 'TEST';
      process.env.INSTALIPA_CONSUMER_KEY = 'test-key';
      process.env.INSTALIPA_CONSUMER_SECRET = 'test-secret';
      process.env.INSTALIPA_CALLBACK_URL = 'https://test.com/callback';

      expect(() => loadAPIConfig()).toThrow(ConfigurationError);
      expect(() => loadAPIConfig()).toThrow('TALKSASA_API_TOKEN');
    });

    it('should throw ConfigurationError when INSTALIPA_CONSUMER_KEY is missing', () => {
      process.env.MPESA_CONSUMER_KEY = 'test-key';
      process.env.MPESA_CONSUMER_SECRET = 'test-secret';
      process.env.MPESA_SHORTCODE = '000772';
      process.env.MPESA_PASSKEY = 'test-passkey';
      process.env.MPESA_CALLBACK_URL = 'https://test.com/callback';
      process.env.TALKSASA_API_TOKEN = 'test-token';
      process.env.TALKSASA_SENDER_ID = 'TEST';
      process.env.INSTALIPA_CONSUMER_SECRET = 'test-secret';
      process.env.INSTALIPA_CALLBACK_URL = 'https://test.com/callback';

      expect(() => loadAPIConfig()).toThrow(ConfigurationError);
      expect(() => loadAPIConfig()).toThrow('INSTALIPA_CONSUMER_KEY');
    });

    it('should trim whitespace from environment variables', () => {
      process.env.MPESA_CONSUMER_KEY = '  test-key  ';
      process.env.MPESA_CONSUMER_SECRET = '  test-secret  ';
      process.env.MPESA_SHORTCODE = '  000772  ';
      process.env.MPESA_PASSKEY = '  test-passkey  ';
      process.env.MPESA_CALLBACK_URL = '  https://test.com/callback  ';
      process.env.TALKSASA_API_TOKEN = '  test-token  ';
      process.env.TALKSASA_SENDER_ID = '  TEST  ';
      process.env.INSTALIPA_CONSUMER_KEY = '  test-key  ';
      process.env.INSTALIPA_CONSUMER_SECRET = '  test-secret  ';
      process.env.INSTALIPA_CALLBACK_URL = '  https://test.com/callback  ';

      const config = loadAPIConfig();

      expect(config.mpesa.consumerKey).toBe('test-key');
      expect(config.mpesa.consumerSecret).toBe('test-secret');
      expect(config.talkSasa.apiToken).toBe('test-token');
      expect(config.instalipa.consumerKey).toBe('test-key');
    });

    it('should treat empty string as missing variable', () => {
      process.env.MPESA_CONSUMER_KEY = '';
      process.env.MPESA_CONSUMER_SECRET = 'test-secret';
      process.env.MPESA_SHORTCODE = '000772';
      process.env.MPESA_PASSKEY = 'test-passkey';
      process.env.MPESA_CALLBACK_URL = 'https://test.com/callback';
      process.env.TALKSASA_API_TOKEN = 'test-token';
      process.env.TALKSASA_SENDER_ID = 'TEST';
      process.env.INSTALIPA_CONSUMER_KEY = 'test-key';
      process.env.INSTALIPA_CONSUMER_SECRET = 'test-secret';
      process.env.INSTALIPA_CALLBACK_URL = 'https://test.com/callback';

      expect(() => loadAPIConfig()).toThrow(ConfigurationError);
      expect(() => loadAPIConfig()).toThrow('MPESA_CONSUMER_KEY');
    });
  });

  describe('validateAPIConfig', () => {
    it('should not throw when configuration is valid', () => {
      process.env.MPESA_CONSUMER_KEY = 'test-mpesa-key';
      process.env.MPESA_CONSUMER_SECRET = 'test-mpesa-secret';
      process.env.MPESA_SHORTCODE = '000772';
      process.env.MPESA_PASSKEY = 'test-passkey';
      process.env.MPESA_CALLBACK_URL = 'https://test.com/callback';
      process.env.TALKSASA_API_TOKEN = 'test-talksasa-token';
      process.env.TALKSASA_SENDER_ID = 'TEST_SENDER';
      process.env.INSTALIPA_CONSUMER_KEY = 'test-instalipa-key';
      process.env.INSTALIPA_CONSUMER_SECRET = 'test-instalipa-secret';
      process.env.INSTALIPA_CALLBACK_URL = 'https://test.com/airtime-callback';

      expect(() => validateAPIConfig()).not.toThrow();
    });

    it('should throw when configuration is invalid', () => {
      // Missing all required variables
      expect(() => validateAPIConfig()).toThrow();
    });
  });
});
