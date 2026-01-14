/**
 * Trovio CorTenX Connector
 * 
 * Client for the Clean Energy Regulator's Unit & Certificate Registry
 * powered by Trovio CorTenX. Enables ABFI to:
 * - Custody ACCUs, SMCs, GOs for growers via sub-wallets
 * - Execute retirements on behalf of growers
 * - Create bundled certificates for Australian Carbon Exchange
 * 
 * @see https://online.cer.gov.au/api/docs
 */

import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const LOG_TAG = 'CorTenX';

// ============================================================================
// TYPES
// ============================================================================

export type CarbonInstrument = 'ACCU' | 'SMC' | 'GO' | 'LGC';

export interface WalletBalance {
  walletId: string;
  instrument: CarbonInstrument;
  available: number;
  locked: number;
  total: number;
  lastUpdated: string;
}

export interface WalletBalances {
  walletId: string;
  balances: WalletBalance[];
  portfolioValueAud: number;
}

export interface UnitRange {
  instrument: CarbonInstrument;
  serialStart: string;
  serialEnd: string;
  quantity: number;
  vintageYear: number;
  projectId: string;
  methodology: string;
}

export interface TransferRequest {
  fromWalletId: string;
  toWalletId: string;
  instrument: CarbonInstrument;
  quantity: number;
  narrative?: string;
}

export interface TransferReceipt {
  txHash: string;
  txUrl: string;
  fromWalletId: string;
  toWalletId: string;
  instrument: CarbonInstrument;
  quantity: number;
  unitSerialStart: string;
  unitSerialEnd: string;
  timestamp: string;
}

export interface RetireRequest {
  walletId: string;
  instrument: CarbonInstrument;
  quantity: number;
  beneficiaryName: string;
  beneficiaryAbn?: string;
  narrative: string;
  projectReference?: string;
  deliveryReference?: string;
}

export interface RetireReceipt {
  txHash: string;
  txUrl: string;
  walletId: string;
  instrument: CarbonInstrument;
  quantity: number;
  unitSerialStart: string;
  unitSerialEnd: string;
  beneficiaryName: string;
  narrative: string;
  retiredAt: string;
  certificateUrl: string;
}

export interface BundleLockRequest {
  walletId: string;
  bundleSerial: string;
  contents: {
    instrument: CarbonInstrument;
    quantity: number;
  }[];
  feedstockTonnes?: number;
  feedstockType?: string;
  description: string;
}

export interface BundleLockReceipt {
  txHash: string;
  bundleSerial: string;
  walletId: string;
  contents: {
    instrument: CarbonInstrument;
    quantity: number;
    serialStart: string;
    serialEnd: string;
  }[];
  lockedAt: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  walletId: string;
  instrument?: CarbonInstrument;
  quantity?: number;
  txHash?: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CORTENX_CONFIG = {
  // CER OAuth endpoints
  authUrl: process.env.CER_AUTH_URL || 'https://online.cer.gov.au/oauth2/authorize',
  tokenUrl: process.env.CER_TOKEN_URL || 'https://online.cer.gov.au/oauth2/token',
  
  // CorTenX API
  apiBaseUrl: process.env.CORTENX_API_URL || 'https://api.cer.gov.au/cortenx/v1',
  
  // ABFI Master Account
  masterAccountId: process.env.ABFI_MASTER_ACCOUNT_ID || '',
  masterApiKey: process.env.ABFI_MASTER_API_KEY || '',
  
  // OAuth client credentials
  clientId: process.env.CER_CLIENT_ID || '',
  clientSecret: process.env.CER_CLIENT_SECRET || '',
  redirectUri: process.env.CER_REDIRECT_URI || 'https://abfi.io/api/carbon/oauth/callback',
  
  // Webhook verification
  webhookSecret: process.env.CORTENX_WEBHOOK_SECRET || '',
  
  // Encryption key for token storage
  encryptionKey: process.env.CARBON_ENCRYPTION_KEY || '',
};

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt sensitive data (OAuth tokens) for storage
 */
export function encryptToken(plaintext: string): string {
  const key = Buffer.from(CORTENX_CONFIG.encryptionKey, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt stored OAuth tokens
 */
export function decryptToken(ciphertext: string): string {
  const key = Buffer.from(CORTENX_CONFIG.encryptionKey, 'hex');
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Verify webhook signature from CorTenX
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', CORTENX_CONFIG.webhookSecret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ============================================================================
// CORTENX API CLIENT
// ============================================================================

class CorTenXClient {
  private baseUrl: string;
  private masterAccountId: string;
  private masterApiKey: string;

  constructor() {
    this.baseUrl = CORTENX_CONFIG.apiBaseUrl;
    this.masterAccountId = CORTENX_CONFIG.masterAccountId;
    this.masterApiKey = CORTENX_CONFIG.masterApiKey;
  }

  /**
   * Make authenticated API request to CorTenX
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    accessToken?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.masterApiKey,
      'X-Account-ID': this.masterAccountId,
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    logger.info(LOG_TAG, 'API Request', { method, endpoint });
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(LOG_TAG, 'API Error', { status: response.status, error: errorText });
        throw new Error(`CorTenX API error: ${response.status} - ${errorText}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      logger.error(LOG_TAG, 'API Request Failed', { endpoint, error });
      throw error;
    }
  }

  // ==========================================================================
  // OAUTH FLOW
  // ==========================================================================

  /**
   * Generate OAuth authorization URL for grower delegation
   */
  getAuthorizationUrl(state: string, userId: number): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CORTENX_CONFIG.clientId,
      redirect_uri: CORTENX_CONFIG.redirectUri,
      scope: 'wallet:read wallet:transfer wallet:retire',
      state: `${state}:${userId}`,
    });
    
    return `${CORTENX_CONFIG.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch(CORTENX_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: CORTENX_CONFIG.redirectUri,
        client_id: CORTENX_CONFIG.clientId,
        client_secret: CORTENX_CONFIG.clientSecret,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange authorization code');
    }
    
    const data = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
      scope: string;
    };
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(CORTENX_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CORTENX_CONFIG.clientId,
        client_secret: CORTENX_CONFIG.clientSecret,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }
    
    const data = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
      scope: string;
    };
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  // ==========================================================================
  // WALLET OPERATIONS
  // ==========================================================================

  /**
   * Create a sub-wallet for a grower under ABFI master account
   */
  async createSubWallet(
    growerName: string,
    growerAbn: string,
    accessToken: string
  ): Promise<{ walletId: string }> {
    return this.request<{ walletId: string }>(
      'POST',
      '/wallets',
      {
        parentAccountId: this.masterAccountId,
        walletType: 'SUB_WALLET',
        ownerName: growerName,
        ownerAbn: growerAbn,
        delegatedOperator: this.masterAccountId,
      },
      accessToken
    );
  }

  /**
   * Get wallet balances
   */
  async getWalletBalance(walletId: string, accessToken?: string): Promise<WalletBalances> {
    // In development/demo mode, return simulated data
    if (!this.masterApiKey || process.env.NODE_ENV !== 'production') {
      return this.getSimulatedBalance(walletId);
    }
    
    return this.request<WalletBalances>(
      'GET',
      `/wallets/${walletId}/balance`,
      undefined,
      accessToken
    );
  }

  /**
   * Get unit holdings with serial numbers
   */
  async getWalletHoldings(
    walletId: string,
    instrument?: CarbonInstrument,
    accessToken?: string
  ): Promise<UnitRange[]> {
    const query = instrument ? `?instrument=${instrument}` : '';
    return this.request<UnitRange[]>(
      'GET',
      `/wallets/${walletId}/holdings${query}`,
      undefined,
      accessToken
    );
  }

  // ==========================================================================
  // TRANSFER OPERATIONS
  // ==========================================================================

  /**
   * Transfer units between wallets
   */
  async transferUnits(
    request: TransferRequest,
    accessToken: string
  ): Promise<TransferReceipt> {
    return this.request<TransferReceipt>(
      'POST',
      '/transfers',
      request,
      accessToken
    );
  }

  // ==========================================================================
  // RETIREMENT OPERATIONS
  // ==========================================================================

  /**
   * Retire carbon units on behalf of a grower
   */
  async retireUnits(
    request: RetireRequest,
    accessToken: string
  ): Promise<RetireReceipt> {
    // In development/demo mode, return simulated receipt
    if (!this.masterApiKey || process.env.NODE_ENV !== 'production') {
      return this.getSimulatedRetireReceipt(request);
    }
    
    return this.request<RetireReceipt>(
      'POST',
      '/retirements',
      {
        walletId: request.walletId,
        instrument: request.instrument,
        quantity: request.quantity,
        beneficiary: {
          name: request.beneficiaryName,
          abn: request.beneficiaryAbn,
        },
        narrative: request.narrative,
        references: {
          project: request.projectReference,
          delivery: request.deliveryReference,
        },
      },
      accessToken
    );
  }

  /**
   * Get retirement certificate/receipt
   */
  async getRetirementReceipt(txHash: string): Promise<RetireReceipt> {
    return this.request<RetireReceipt>(
      'GET',
      `/retirements/${txHash}`
    );
  }

  // ==========================================================================
  // BUNDLE OPERATIONS
  // ==========================================================================

  /**
   * Lock units into a bundle for ACX listing
   */
  async lockBundle(
    request: BundleLockRequest,
    accessToken: string
  ): Promise<BundleLockReceipt> {
    return this.request<BundleLockReceipt>(
      'POST',
      '/bundles/lock',
      request,
      accessToken
    );
  }

  /**
   * Release/cancel a bundle lock
   */
  async releaseBundle(
    bundleSerial: string,
    accessToken: string
  ): Promise<{ txHash: string; releasedAt: string }> {
    return this.request<{ txHash: string; releasedAt: string }>(
      'POST',
      `/bundles/${bundleSerial}/release`,
      {},
      accessToken
    );
  }

  // ==========================================================================
  // TRANSACTION HISTORY
  // ==========================================================================

  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(
    walletId: string,
    options?: {
      instrument?: CarbonInstrument;
      txnType?: 'IN' | 'OUT' | 'RETIRE';
      fromDate?: string;
      toDate?: string;
      limit?: number;
    },
    accessToken?: string
  ): Promise<{
    transactions: Array<{
      txHash: string;
      txnType: 'IN' | 'OUT' | 'RETIRE';
      instrument: CarbonInstrument;
      quantity: number;
      counterparty?: string;
      narrative?: string;
      timestamp: string;
    }>;
    totalCount: number;
  }> {
    const params = new URLSearchParams();
    if (options?.instrument) params.set('instrument', options.instrument);
    if (options?.txnType) params.set('type', options.txnType);
    if (options?.fromDate) params.set('from', options.fromDate);
    if (options?.toDate) params.set('to', options.toDate);
    if (options?.limit) params.set('limit', options.limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    
    return this.request(
      'GET',
      `/wallets/${walletId}/transactions${query}`,
      undefined,
      accessToken
    );
  }

  // ==========================================================================
  // PRICE DATA
  // ==========================================================================

  /**
   * Get current carbon credit prices
   */
  async getCarbonPrices(): Promise<{
    prices: Array<{
      instrument: CarbonInstrument;
      spotPrice: number;
      bidPrice: number;
      askPrice: number;
      change24h: number;
      volume24h: number;
      source: string;
    }>;
    updatedAt: string;
  }> {
    // In development, return simulated prices
    if (!this.masterApiKey || process.env.NODE_ENV !== 'production') {
      return this.getSimulatedPrices();
    }
    
    return this.request('GET', '/prices');
  }

  // ==========================================================================
  // SIMULATED DATA (for development/demo)
  // ==========================================================================

  private getSimulatedBalance(walletId: string): WalletBalances {
    // Generate deterministic but varied balances based on wallet ID
    const seed = walletId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const baseAccu = 500 + (seed % 2000);
    const baseSmc = 100 + (seed % 500);
    const baseGo = 200 + (seed % 800);
    
    const accuPrice = 32.50;
    const smcPrice = 28.00;
    const goPrice = 45.00;
    
    return {
      walletId,
      balances: [
        {
          walletId,
          instrument: 'ACCU',
          available: baseAccu,
          locked: Math.floor(baseAccu * 0.1),
          total: baseAccu + Math.floor(baseAccu * 0.1),
          lastUpdated: new Date().toISOString(),
        },
        {
          walletId,
          instrument: 'SMC',
          available: baseSmc,
          locked: 0,
          total: baseSmc,
          lastUpdated: new Date().toISOString(),
        },
        {
          walletId,
          instrument: 'GO',
          available: baseGo,
          locked: Math.floor(baseGo * 0.05),
          total: baseGo + Math.floor(baseGo * 0.05),
          lastUpdated: new Date().toISOString(),
        },
        {
          walletId,
          instrument: 'LGC',
          available: 0,
          locked: 0,
          total: 0,
          lastUpdated: new Date().toISOString(),
        },
      ],
      portfolioValueAud: (baseAccu * accuPrice) + (baseSmc * smcPrice) + (baseGo * goPrice),
    };
  }

  private getSimulatedRetireReceipt(request: RetireRequest): RetireReceipt {
    const txHash = crypto.randomBytes(32).toString('hex');
    const serialStart = `ACCU-${Date.now()}-001`;
    const serialEnd = `ACCU-${Date.now()}-${request.quantity.toString().padStart(3, '0')}`;
    
    return {
      txHash,
      txUrl: `https://online.cer.gov.au/lookup/${txHash}`,
      walletId: request.walletId,
      instrument: request.instrument,
      quantity: request.quantity,
      unitSerialStart: serialStart,
      unitSerialEnd: serialEnd,
      beneficiaryName: request.beneficiaryName,
      narrative: request.narrative,
      retiredAt: new Date().toISOString(),
      certificateUrl: `https://online.cer.gov.au/certificates/${txHash}`,
    };
  }

  private getSimulatedPrices(): {
    prices: Array<{
      instrument: CarbonInstrument;
      spotPrice: number;
      bidPrice: number;
      askPrice: number;
      change24h: number;
      volume24h: number;
      source: string;
    }>;
    updatedAt: string;
  } {
    // Simulate realistic ACCU prices with slight variation
    const baseAccu = 32.50;
    const baseSmc = 28.00;
    const baseGo = 45.00;
    const baseLgc = 52.00;
    
    const variation = () => (Math.random() - 0.5) * 2;
    
    return {
      prices: [
        {
          instrument: 'ACCU',
          spotPrice: baseAccu + variation(),
          bidPrice: baseAccu - 0.25 + variation() * 0.1,
          askPrice: baseAccu + 0.25 + variation() * 0.1,
          change24h: variation() * 0.5,
          volume24h: 15000 + Math.floor(Math.random() * 5000),
          source: 'CBL',
        },
        {
          instrument: 'SMC',
          spotPrice: baseSmc + variation(),
          bidPrice: baseSmc - 0.30 + variation() * 0.1,
          askPrice: baseSmc + 0.30 + variation() * 0.1,
          change24h: variation() * 0.4,
          volume24h: 8000 + Math.floor(Math.random() * 3000),
          source: 'CBL',
        },
        {
          instrument: 'GO',
          spotPrice: baseGo + variation(),
          bidPrice: baseGo - 0.50 + variation() * 0.1,
          askPrice: baseGo + 0.50 + variation() * 0.1,
          change24h: variation() * 0.3,
          volume24h: 5000 + Math.floor(Math.random() * 2000),
          source: 'AEMO',
        },
        {
          instrument: 'LGC',
          spotPrice: baseLgc + variation(),
          bidPrice: baseLgc - 0.40 + variation() * 0.1,
          askPrice: baseLgc + 0.40 + variation() * 0.1,
          change24h: variation() * 0.6,
          volume24h: 12000 + Math.floor(Math.random() * 4000),
          source: 'AEMO',
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const cortenxClient = new CorTenXClient();

// Export types for use in routers
export type { CorTenXClient };
