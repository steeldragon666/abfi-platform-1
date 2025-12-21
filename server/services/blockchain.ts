/**
 * ABFI Blockchain Integration Service
 * Handles Ethereum blockchain anchoring for evidence vault Merkle roots
 *
 * Supports:
 * - Ethereum Mainnet, Sepolia, Polygon
 * - Smart contract interaction for Merkle root storage
 * - Transaction management with retry logic
 */

import { ethers, JsonRpcProvider, Wallet, Contract, ContractTransactionResponse } from "ethers";

// ABFI Evidence Anchor Contract ABI (minimal interface)
const ANCHOR_CONTRACT_ABI = [
  "function anchorMerkleRoot(bytes32 merkleRoot, uint256 leafCount, uint256 batchId) external returns (uint256 anchorId)",
  "function getAnchor(uint256 anchorId) external view returns (bytes32 merkleRoot, uint256 leafCount, uint256 timestamp, address submitter)",
  "function verifyInclusion(bytes32 merkleRoot, bytes32 leaf, bytes32[] calldata proof) external pure returns (bool)",
  "event MerkleRootAnchored(uint256 indexed anchorId, bytes32 indexed merkleRoot, uint256 leafCount, address submitter)",
];

export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  chainName: string;
  contractAddress: string;
  privateKey?: string;
}

export interface AnchorResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  blockTimestamp?: Date;
  onChainAnchorId?: number;
  error?: string;
  gasUsed?: string;
}

export interface AnchorData {
  merkleRoot: string;
  leafCount: number;
  timestamp: number;
  submitter: string;
}

// Default configurations for supported chains
const CHAIN_CONFIGS: Record<string, Partial<BlockchainConfig>> = {
  ethereum: {
    chainId: 1,
    chainName: "ethereum",
    rpcUrl: "https://eth.llamarpc.com",
  },
  sepolia: {
    chainId: 11155111,
    chainName: "sepolia",
    rpcUrl: "https://rpc.sepolia.org",
  },
  polygon: {
    chainId: 137,
    chainName: "polygon",
    rpcUrl: "https://polygon-rpc.com",
  },
  polygonAmoy: {
    chainId: 80002,
    chainName: "polygon-amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
  },
};

/**
 * BlockchainService handles all Ethereum interactions for the Evidence Vault
 */
export class BlockchainService {
  private provider: JsonRpcProvider;
  private wallet: Wallet | null = null;
  private contract: Contract;
  private config: BlockchainConfig;

  constructor(config: BlockchainConfig) {
    this.config = config;
    this.provider = new JsonRpcProvider(config.rpcUrl, {
      chainId: config.chainId,
      name: config.chainName,
    });

    if (config.privateKey) {
      this.wallet = new Wallet(config.privateKey, this.provider);
    }

    const signer = this.wallet || this.provider;
    this.contract = new Contract(config.contractAddress, ANCHOR_CONTRACT_ABI, signer);
  }

  /**
   * Submit a Merkle root to the blockchain
   */
  async anchorMerkleRoot(
    merkleRoot: string,
    leafCount: number,
    batchId: number
  ): Promise<AnchorResult> {
    if (!this.wallet) {
      return {
        success: false,
        error: "No private key configured for blockchain transactions",
      };
    }

    try {
      // Ensure merkleRoot is properly formatted as bytes32
      const merkleRootBytes32 = merkleRoot.startsWith("0x")
        ? merkleRoot
        : "0x" + merkleRoot;

      // Estimate gas first
      const gasEstimate = await this.contract.anchorMerkleRoot.estimateGas(
        merkleRootBytes32,
        leafCount,
        batchId
      );

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

      // Submit transaction
      const tx: ContractTransactionResponse = await this.contract.anchorMerkleRoot(
        merkleRootBytes32,
        leafCount,
        batchId,
        { gasLimit }
      );

      console.log(`[Blockchain] Transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(1);

      if (!receipt) {
        return {
          success: false,
          error: "Transaction receipt not available",
        };
      }

      // Parse event to get anchor ID
      let onChainAnchorId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === "MerkleRootAnchored") {
            onChainAnchorId = Number(parsed.args[0]);
            break;
          }
        } catch {
          // Skip logs that don't match our ABI
        }
      }

      // Get block timestamp
      const block = await this.provider.getBlock(receipt.blockNumber);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockTimestamp: block ? new Date(block.timestamp * 1000) : new Date(),
        onChainAnchorId,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Blockchain] Anchor failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Retrieve anchor data from the blockchain
   */
  async getAnchor(anchorId: number): Promise<AnchorData | null> {
    try {
      const result = await this.contract.getAnchor(anchorId);
      return {
        merkleRoot: result.merkleRoot,
        leafCount: Number(result.leafCount),
        timestamp: Number(result.timestamp),
        submitter: result.submitter,
      };
    } catch (error) {
      console.error(`[Blockchain] Failed to get anchor ${anchorId}:`, error);
      return null;
    }
  }

  /**
   * Verify a Merkle proof on-chain
   */
  async verifyInclusion(
    merkleRoot: string,
    leaf: string,
    proof: string[]
  ): Promise<boolean> {
    try {
      const merkleRootBytes32 = merkleRoot.startsWith("0x") ? merkleRoot : "0x" + merkleRoot;
      const leafBytes32 = leaf.startsWith("0x") ? leaf : "0x" + leaf;
      const proofBytes32 = proof.map((p) => (p.startsWith("0x") ? p : "0x" + p));

      return await this.contract.verifyInclusion(merkleRootBytes32, leafBytes32, proofBytes32);
    } catch (error) {
      console.error(`[Blockchain] Verification failed:`, error);
      return false;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<{ gasPrice: string; maxFeePerGas?: string }> {
    const feeData = await this.provider.getFeeData();
    return {
      gasPrice: feeData.gasPrice?.toString() || "0",
      maxFeePerGas: feeData.maxFeePerGas?.toString(),
    };
  }

  /**
   * Check if the service is connected and operational
   */
  async healthCheck(): Promise<{
    connected: boolean;
    chainId: number;
    blockNumber: number;
    walletAddress?: string;
    walletBalance?: string;
  }> {
    try {
      const [network, blockNumber] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber(),
      ]);

      const result: {
        connected: boolean;
        chainId: number;
        blockNumber: number;
        walletAddress?: string;
        walletBalance?: string;
      } = {
        connected: true,
        chainId: Number(network.chainId),
        blockNumber,
      };

      if (this.wallet) {
        result.walletAddress = await this.wallet.getAddress();
        const balance = await this.provider.getBalance(result.walletAddress);
        result.walletBalance = ethers.formatEther(balance);
      }

      return result;
    } catch (error) {
      return {
        connected: false,
        chainId: 0,
        blockNumber: 0,
      };
    }
  }
}

// Singleton instance
let blockchainServiceInstance: BlockchainService | null = null;

/**
 * Get or create the blockchain service instance
 */
export function getBlockchainService(): BlockchainService | null {
  if (blockchainServiceInstance) {
    return blockchainServiceInstance;
  }

  const rpcUrl = process.env.ETHEREUM_RPC_URL;
  const contractAddress = process.env.EVIDENCE_ANCHOR_CONTRACT;
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  const chainName = process.env.BLOCKCHAIN_CHAIN || "sepolia";

  if (!rpcUrl || !contractAddress) {
    console.warn(
      "[Blockchain] Service not configured. Set ETHEREUM_RPC_URL and EVIDENCE_ANCHOR_CONTRACT."
    );
    return null;
  }

  const chainConfig = CHAIN_CONFIGS[chainName] || CHAIN_CONFIGS.sepolia;

  blockchainServiceInstance = new BlockchainService({
    rpcUrl,
    chainId: chainConfig.chainId!,
    chainName: chainConfig.chainName!,
    contractAddress,
    privateKey,
  });

  return blockchainServiceInstance;
}

/**
 * Create a blockchain service for a specific chain (for multi-chain support)
 */
export function createBlockchainService(
  chainName: keyof typeof CHAIN_CONFIGS,
  contractAddress: string,
  privateKey?: string
): BlockchainService {
  const chainConfig = CHAIN_CONFIGS[chainName];
  if (!chainConfig) {
    throw new Error(`Unknown chain: ${chainName}`);
  }

  return new BlockchainService({
    rpcUrl: chainConfig.rpcUrl!,
    chainId: chainConfig.chainId!,
    chainName: chainConfig.chainName!,
    contractAddress,
    privateKey,
  });
}
