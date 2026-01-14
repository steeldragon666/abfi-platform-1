/**
 * Carbon Registry Router
 * 
 * tRPC router for Trovio CorTenX integration.
 * Enables growers to view wallet balances, retire ACCUs, and create bundles.
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './_core/trpc.js';
import { TRPCError } from '@trpc/server';
import { 
  cortenxClient, 
  encryptToken, 
  decryptToken,
  verifyWebhookSignature,
  type CarbonInstrument,
  type RetireReceipt,
} from './connectors/cortenxConnector.js';
import { logger } from './utils/logger.js';
import crypto from 'crypto';

const LOG_TAG = 'CarbonRouter';

// ============================================================================
// SCHEMAS
// ============================================================================

const CarbonInstrumentSchema = z.enum(['ACCU', 'SMC', 'GO', 'LGC', 'BUNDLE']);

const BalanceSchema = z.object({
  walletId: z.string(),
  balances: z.array(z.object({
    instrument: CarbonInstrumentSchema,
    available: z.number(),
    locked: z.number(),
    total: z.number(),
  })),
  portfolioValueAud: z.number(),
  lastUpdated: z.string(),
});

const RetireInputSchema = z.object({
  instrument: z.enum(['ACCU', 'SMC', 'GO', 'LGC']),
  quantity: z.number().int().positive().max(10000),
  beneficiaryName: z.string().min(1).max(255),
  beneficiaryAbn: z.string().optional(),
  narrative: z.string().min(10).max(1000),
  projectReference: z.string().optional(),
  deliveryReference: z.string().optional(),
});

const RetireReceiptSchema = z.object({
  txHash: z.string(),
  txUrl: z.string(),
  instrument: CarbonInstrumentSchema,
  quantity: z.number(),
  unitSerialStart: z.string(),
  unitSerialEnd: z.string(),
  beneficiaryName: z.string(),
  narrative: z.string(),
  retiredAt: z.string(),
  certificateUrl: z.string(),
});

const TransactionSchema = z.object({
  id: z.number(),
  txnType: z.enum(['IN', 'OUT', 'RETIRE', 'BUNDLE_LOCK', 'BUNDLE_RELEASE']),
  instrument: CarbonInstrumentSchema,
  quantity: z.number(),
  registryHash: z.string(),
  registryUrl: z.string().nullable(),
  retirementNote: z.string().nullable(),
  createdAt: z.string(),
});

const BundleInputSchema = z.object({
  bundleType: z.enum(['FEEDSTOCK_CARBON', 'FEEDSTOCK_CARBON_GO', 'CARBON_ONLY']),
  contents: z.array(z.object({
    instrument: z.enum(['ACCU', 'SMC', 'GO', 'LGC']),
    quantity: z.number().int().positive(),
  })),
  feedstockTonnes: z.number().positive().optional(),
  feedstockType: z.string().optional(),
  description: z.string().min(10).max(500),
  vintageYear: z.number().int().min(2020).max(2030).optional(),
});

const BundleReceiptSchema = z.object({
  bundleSerial: z.string(),
  txHash: z.string(),
  status: z.string(),
  contents: z.array(z.object({
    instrument: CarbonInstrumentSchema,
    quantity: z.number(),
    serialStart: z.string(),
    serialEnd: z.string(),
  })),
  lockedAt: z.string(),
});

const PriceSchema = z.object({
  instrument: CarbonInstrumentSchema,
  spotPrice: z.number(),
  bidPrice: z.number(),
  askPrice: z.number(),
  change24h: z.number(),
  volume24h: z.number(),
  source: z.string(),
});

const AutoRetireRuleSchema = z.object({
  triggerEvent: z.enum(['delivery_verified', 'quality_verified', 'payment_settled']),
  feedstockType: z.string().nullable(),
  accuPerTonne: z.number().positive().default(1.8),
  retirementNarrativeTemplate: z.string().optional(),
  maxRetirePerDelivery: z.number().int().positive().optional(),
  monthlyRetireLimit: z.number().int().positive().optional(),
});

// ============================================================================
// SIMULATED DATA STORE (for demo - would be DB in production)
// ============================================================================

// Simulated custody tokens for demo users
const demoCustodyTokens: Map<number, {
  subWalletId: string;
  encAccess: string;
  encRefresh: string;
  walletStatus: 'active' | 'suspended' | 'revoked';
}> = new Map();

// Simulated transaction history
const demoTransactions: Map<number, Array<{
  id: number;
  txnType: 'IN' | 'OUT' | 'RETIRE' | 'BUNDLE_LOCK' | 'BUNDLE_RELEASE';
  instrument: CarbonInstrument;
  quantity: number;
  registryHash: string;
  registryUrl: string | null;
  retirementNote: string | null;
  createdAt: string;
}>> = new Map();

let txnIdCounter = 1;

// Initialize demo data for test users
function initDemoData(userId: number): string {
  if (!demoCustodyTokens.has(userId)) {
    const walletId = `ABFI-SUB-${userId.toString().padStart(6, '0')}`;
    demoCustodyTokens.set(userId, {
      subWalletId: walletId,
      encAccess: 'demo-access-token',
      encRefresh: 'demo-refresh-token',
      walletStatus: 'active',
    });
    
    // Add some demo transactions
    const now = new Date();
    demoTransactions.set(userId, [
      {
        id: txnIdCounter++,
        txnType: 'IN',
        instrument: 'ACCU',
        quantity: 500,
        registryHash: crypto.randomBytes(32).toString('hex'),
        registryUrl: 'https://online.cer.gov.au/lookup/demo1',
        retirementNote: null,
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: txnIdCounter++,
        txnType: 'RETIRE',
        instrument: 'ACCU',
        quantity: 180,
        registryHash: crypto.randomBytes(32).toString('hex'),
        registryUrl: 'https://online.cer.gov.au/lookup/demo2',
        retirementNote: 'Retired by ABFI on behalf of Demo Grower - Beema bamboo delivery Q4 2025',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: txnIdCounter++,
        txnType: 'IN',
        instrument: 'GO',
        quantity: 200,
        registryHash: crypto.randomBytes(32).toString('hex'),
        registryUrl: 'https://online.cer.gov.au/lookup/demo3',
        retirementNote: null,
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
  }
  return demoCustodyTokens.get(userId)!.subWalletId;
}

// ============================================================================
// ROUTER
// ============================================================================

export const carbonRouter = router({
  /**
   * Get OAuth authorization URL for CER delegation
   */
  getAuthUrl: protectedProcedure
    .query(({ ctx }) => {
      const state = crypto.randomBytes(16).toString('hex');
      const authUrl = cortenxClient.getAuthorizationUrl(state, ctx.user.id);
      
      return {
        authUrl,
        state,
      };
    }),

  /**
   * Check if user has connected their carbon wallet
   */
  hasWallet: protectedProcedure
    .query(({ ctx }) => {
      // In demo mode, always return true after initializing
      initDemoData(ctx.user.id);
      return {
        connected: true,
        walletId: demoCustodyTokens.get(ctx.user.id)?.subWalletId || null,
        status: demoCustodyTokens.get(ctx.user.id)?.walletStatus || null,
      };
    }),

  /**
   * Get wallet balance
   */
  balance: protectedProcedure
    .query(async ({ ctx }) => {
      const walletId = initDemoData(ctx.user.id);
      
      try {
        const balances = await cortenxClient.getWalletBalance(walletId);
        
        return {
          walletId: balances.walletId,
          balances: balances.balances.map(b => ({
            instrument: b.instrument,
            available: b.available,
            locked: b.locked,
            total: b.total,
          })),
          portfolioValueAud: balances.portfolioValueAud,
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        logger.error(LOG_TAG, 'Failed to get balance', { userId: ctx.user.id, error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch wallet balance',
        });
      }
    }),

  /**
   * Retire carbon units
   */
  retire: protectedProcedure
    .input(RetireInputSchema)
    .mutation(async ({ ctx, input }) => {
      const custody = demoCustodyTokens.get(ctx.user.id);
      if (!custody) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Carbon wallet not connected. Please verify your carbon assets first.',
        });
      }
      
      if (custody.walletStatus !== 'active') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Carbon wallet is suspended or revoked.',
        });
      }
      
      try {
        const receipt = await cortenxClient.retireUnits(
          {
            walletId: custody.subWalletId,
            instrument: input.instrument as CarbonInstrument,
            quantity: input.quantity,
            beneficiaryName: input.beneficiaryName,
            beneficiaryAbn: input.beneficiaryAbn,
            narrative: input.narrative,
            projectReference: input.projectReference,
            deliveryReference: input.deliveryReference,
          },
          custody.encAccess // In production, would decrypt first
        );
        
        // Record transaction
        const txns = demoTransactions.get(ctx.user.id) || [];
        txns.unshift({
          id: txnIdCounter++,
          txnType: 'RETIRE',
          instrument: input.instrument as CarbonInstrument,
          quantity: input.quantity,
          registryHash: receipt.txHash,
          registryUrl: receipt.txUrl,
          retirementNote: input.narrative,
          createdAt: new Date().toISOString(),
        });
        demoTransactions.set(ctx.user.id, txns);
        
        logger.info(LOG_TAG, 'Units retired', { 
          userId: ctx.user.id, 
          instrument: input.instrument,
          quantity: input.quantity,
          txHash: receipt.txHash,
        });
        
        return {
          txHash: receipt.txHash,
          txUrl: receipt.txUrl,
          instrument: receipt.instrument,
          quantity: receipt.quantity,
          unitSerialStart: receipt.unitSerialStart,
          unitSerialEnd: receipt.unitSerialEnd,
          beneficiaryName: receipt.beneficiaryName,
          narrative: receipt.narrative,
          retiredAt: receipt.retiredAt,
          certificateUrl: receipt.certificateUrl,
        };
      } catch (error) {
        logger.error(LOG_TAG, 'Retirement failed', { userId: ctx.user.id, error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retire units. Please try again.',
        });
      }
    }),

  /**
   * Get transaction history
   */
  history: protectedProcedure
    .input(z.object({
      instrument: z.enum(['ACCU', 'SMC', 'GO', 'LGC']).optional(),
      txnType: z.enum(['IN', 'OUT', 'RETIRE']).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }).optional())
    .query(({ ctx, input }) => {
      initDemoData(ctx.user.id);
      
      let txns = demoTransactions.get(ctx.user.id) || [];
      
      // Filter by instrument
      if (input?.instrument) {
        txns = txns.filter(t => t.instrument === input.instrument);
      }
      
      // Filter by type
      if (input?.txnType) {
        txns = txns.filter(t => t.txnType === input.txnType);
      }
      
      // Limit results
      txns = txns.slice(0, input?.limit || 50);
      
      return {
        transactions: txns,
        totalCount: txns.length,
      };
    }),

  /**
   * Get current carbon prices
   */
  prices: publicProcedure
    .query(async () => {
      try {
        const priceData = await cortenxClient.getCarbonPrices();
        
        return {
          prices: priceData.prices,
          updatedAt: priceData.updatedAt,
        };
      } catch (error) {
        logger.error(LOG_TAG, 'Failed to get prices', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch carbon prices',
        });
      }
    }),

  /**
   * Create a bundle for ACX listing
   */
  mintBundle: protectedProcedure
    .input(BundleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const custody = demoCustodyTokens.get(ctx.user.id);
      if (!custody) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Carbon wallet not connected.',
        });
      }
      
      // Generate bundle serial
      const bundleSerial = `ABFI-BDL-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      try {
        const receipt = await cortenxClient.lockBundle(
          {
            walletId: custody.subWalletId,
            bundleSerial,
            contents: input.contents.map(c => ({
              instrument: c.instrument as CarbonInstrument,
              quantity: c.quantity,
            })),
            feedstockTonnes: input.feedstockTonnes,
            feedstockType: input.feedstockType,
            description: input.description,
          },
          custody.encAccess
        );
        
        // Record bundle lock transaction
        const txns = demoTransactions.get(ctx.user.id) || [];
        for (const content of input.contents) {
          txns.unshift({
            id: txnIdCounter++,
            txnType: 'BUNDLE_LOCK',
            instrument: content.instrument as CarbonInstrument,
            quantity: content.quantity,
            registryHash: receipt.txHash,
            registryUrl: null,
            retirementNote: `Locked in bundle ${bundleSerial}`,
            createdAt: new Date().toISOString(),
          });
        }
        demoTransactions.set(ctx.user.id, txns);
        
        logger.info(LOG_TAG, 'Bundle created', { 
          userId: ctx.user.id, 
          bundleSerial,
          txHash: receipt.txHash,
        });
        
        return {
          bundleSerial: receipt.bundleSerial,
          txHash: receipt.txHash,
          status: 'locked',
          contents: receipt.contents,
          lockedAt: receipt.lockedAt,
        };
      } catch (error) {
        logger.error(LOG_TAG, 'Bundle creation failed', { userId: ctx.user.id, error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create bundle. Please try again.',
        });
      }
    }),

  /**
   * Get auto-retire rules for user
   */
  getAutoRetireRules: protectedProcedure
    .query(({ ctx }) => {
      // Return default rule for demo
      return {
        rules: [
          {
            id: 1,
            isActive: true,
            triggerEvent: 'delivery_verified' as const,
            feedstockType: null,
            accuPerTonne: 1.8,
            retirementNarrativeTemplate: 'Retired by ABFI on behalf of {grower_name} ({grower_abn}) - {feedstock_type} delivery {delivery_id}',
            maxRetirePerDelivery: null,
            monthlyRetireLimit: null,
          },
        ],
      };
    }),

  /**
   * Update auto-retire rule
   */
  updateAutoRetireRule: protectedProcedure
    .input(z.object({
      ruleId: z.number().optional(),
      rule: AutoRetireRuleSchema,
    }))
    .mutation(({ ctx, input }) => {
      logger.info(LOG_TAG, 'Auto-retire rule updated', { userId: ctx.user.id, rule: input.rule });
      
      return {
        success: true,
        ruleId: input.ruleId || 1,
      };
    }),

  /**
   * Get impact stats (total retired, CO2e equivalent)
   */
  impactStats: protectedProcedure
    .query(({ ctx }) => {
      initDemoData(ctx.user.id);
      
      const txns = demoTransactions.get(ctx.user.id) || [];
      const retirements = txns.filter(t => t.txnType === 'RETIRE');
      
      const totalRetired = retirements.reduce((sum, t) => sum + t.quantity, 0);
      
      // 1 ACCU = 1 tonne CO2e
      // Average car emits ~4.6 tonnes CO2 per year
      const carsOffRoad = Math.round(totalRetired / 4.6);
      
      // Average household emits ~10 tonnes CO2 per year
      const householdsOffset = Math.round(totalRetired / 10);
      
      // Trees absorb ~22kg CO2 per year
      const treesEquivalent = Math.round((totalRetired * 1000) / 22);
      
      return {
        totalRetired,
        retirementCount: retirements.length,
        equivalents: {
          carsOffRoad,
          householdsOffset,
          treesEquivalent,
        },
        lastRetirement: retirements[0]?.createdAt || null,
      };
    }),

  /**
   * Webhook handler for CorTenX events
   */
  webhook: publicProcedure
    .input(z.object({
      eventId: z.string(),
      eventType: z.string(),
      payload: z.record(z.unknown()),
      signature: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Verify signature
      const payloadString = JSON.stringify(input.payload);
      const isValid = verifyWebhookSignature(payloadString, input.signature);
      
      if (!isValid) {
        logger.warn(LOG_TAG, 'Invalid webhook signature', { eventId: input.eventId });
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid webhook signature',
        });
      }
      
      logger.info(LOG_TAG, 'Webhook received', { 
        eventId: input.eventId, 
        eventType: input.eventType,
      });
      
      // Process webhook based on event type
      switch (input.eventType) {
        case 'unit.transferred':
          // Update balance cache
          break;
        case 'unit.retired':
          // Update balance cache and stats
          break;
        case 'bundle.locked':
          // Update bundle status
          break;
        case 'bundle.released':
          // Update bundle status
          break;
        default:
          logger.info(LOG_TAG, 'Unhandled webhook event type', { eventType: input.eventType });
      }
      
      return { received: true };
    }),
});

export type CarbonRouter = typeof carbonRouter;
