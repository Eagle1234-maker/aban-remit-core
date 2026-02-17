/**
 * Wallet Lookup Engine
 * 
 * Provides secure wallet information lookup for transaction confirmation.
 * Implements phone masking and state validation to protect user privacy
 * and prevent invalid transactions.
 * 
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7
 */

export { WalletLookupEngine } from './interface.js';
export { WalletLookupEngineImpl } from './implementation.js';
export { WalletLookupResult, WalletLookupError } from './types.js';
