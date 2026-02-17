/**
 * API Configuration Loader
 * 
 * Loads and validates all required environment variables for external API integrations.
 * Throws configuration errors at startup if required variables are missing.
 */

export interface MPesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  apiUrl: string;
  timeout: number;
}

export interface TalkSasaConfig {
  apiToken: string;
  senderId: string;
  apiUrl: string;
  timeout: number;
}

export interface InstalipaConfig {
  consumerKey: string;
  consumerSecret: string;
  callbackUrl: string;
  apiUrl: string;
  timeout: number;
}

export interface APIConfig {
  mpesa: MPesaConfig;
  talkSasa: TalkSasaConfig;
  instalipa: InstalipaConfig;
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Get required environment variable or throw error
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new ConfigurationError(
      `Missing required environment variable: ${key}. ` +
      `Please set this variable in your .env file.`
    );
  }
  return value.trim();
}

/**
 * Get optional environment variable with default value
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

/**
 * Load M-Pesa configuration
 */
function loadMPesaConfig(): MPesaConfig {
  return {
    consumerKey: getRequiredEnv('MPESA_CONSUMER_KEY'),
    consumerSecret: getRequiredEnv('MPESA_CONSUMER_SECRET'),
    shortcode: getRequiredEnv('MPESA_SHORTCODE'),
    passkey: getRequiredEnv('MPESA_PASSKEY'),
    callbackUrl: getRequiredEnv('MPESA_CALLBACK_URL'),
    apiUrl: getOptionalEnv('MPESA_API_URL', 'https://api.safaricom.co.ke'),
    timeout: parseInt(getOptionalEnv('MPESA_TIMEOUT', '30000'), 10),
  };
}

/**
 * Load TalkSasa configuration
 */
function loadTalkSasaConfig(): TalkSasaConfig {
  return {
    apiToken: getRequiredEnv('TALKSASA_API_TOKEN'),
    senderId: getRequiredEnv('TALKSASA_SENDER_ID'),
    apiUrl: getOptionalEnv('TALKSASA_API_URL', 'https://bulksms.talksasa.com/api/v3'),
    timeout: parseInt(getOptionalEnv('TALKSASA_TIMEOUT', '15000'), 10),
  };
}

/**
 * Load Instalipa configuration
 */
function loadInstalipaConfig(): InstalipaConfig {
  return {
    consumerKey: getRequiredEnv('INSTALIPA_CONSUMER_KEY'),
    consumerSecret: getRequiredEnv('INSTALIPA_CONSUMER_SECRET'),
    callbackUrl: getRequiredEnv('INSTALIPA_CALLBACK_URL'),
    apiUrl: getOptionalEnv('INSTALIPA_API_URL', 'https://api.instalipa.com'),
    timeout: parseInt(getOptionalEnv('INSTALIPA_TIMEOUT', '30000'), 10),
  };
}

/**
 * Load and validate all API configurations
 * Throws ConfigurationError if any required variable is missing
 */
export function loadAPIConfig(): APIConfig {
  try {
    return {
      mpesa: loadMPesaConfig(),
      talkSasa: loadTalkSasaConfig(),
      instalipa: loadInstalipaConfig(),
    };
  } catch (error) {
    if (error instanceof ConfigurationError) {
      // Re-throw configuration errors with clear message
      throw error;
    }
    // Wrap unexpected errors
    throw new ConfigurationError(
      `Failed to load API configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate configuration at startup
 * Call this function when the application starts to fail fast if configuration is invalid
 */
export function validateAPIConfig(): void {
  try {
    const config = loadAPIConfig();
    console.log('✓ API configuration loaded successfully');
    console.log(`  - M-Pesa: ${maskCredential(config.mpesa.consumerKey)}`);
    console.log(`  - TalkSasa: ${maskCredential(config.talkSasa.apiToken)}`);
    console.log(`  - Instalipa: ${maskCredential(config.instalipa.consumerKey)}`);
  } catch (error) {
    console.error('✗ API configuration validation failed');
    if (error instanceof ConfigurationError) {
      console.error(`  ${error.message}`);
    } else {
      console.error(`  ${error}`);
    }
    throw error;
  }
}

/**
 * Mask credential for logging (show first and last 4 characters)
 */
function maskCredential(credential: string): string {
  if (credential.length <= 8) {
    return '****';
  }
  const first4 = credential.substring(0, 4);
  const last4 = credential.substring(credential.length - 4);
  return `${first4}...${last4}`;
}

// Export singleton instance
let configInstance: APIConfig | null = null;

/**
 * Get API configuration singleton
 * Loads configuration on first call and caches it
 */
export function getAPIConfig(): APIConfig {
  if (!configInstance) {
    configInstance = loadAPIConfig();
  }
  return configInstance;
}

export { ConfigurationError };
