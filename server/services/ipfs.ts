/**
 * ABFI IPFS Integration Service
 * Content-addressed storage for evidence documents and manifests
 *
 * Supports:
 * - IPFS HTTP API (Infura, Pinata, local node)
 * - Content pinning for persistence
 * - JSON and binary content storage
 */

import crypto from "crypto";

export interface IPFSConfig {
  apiUrl: string;
  projectId?: string;
  projectSecret?: string;
  gatewayUrl?: string;
}

export interface IPFSUploadResult {
  success: boolean;
  cid?: string;
  uri?: string;
  size?: number;
  error?: string;
}

export interface IPFSRetrieveResult {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  error?: string;
}

export interface PinStatus {
  cid: string;
  pinned: boolean;
  size?: number;
  created?: Date;
}

/**
 * IPFSService handles all IPFS interactions for document storage
 */
export class IPFSService {
  private config: IPFSConfig;
  private headers: Record<string, string>;

  constructor(config: IPFSConfig) {
    this.config = config;
    this.headers = {
      "Content-Type": "application/json",
    };

    // Setup authentication for Infura
    if (config.projectId && config.projectSecret) {
      const auth = Buffer.from(`${config.projectId}:${config.projectSecret}`).toString("base64");
      this.headers["Authorization"] = `Basic ${auth}`;
    }
  }

  /**
   * Upload JSON content to IPFS
   */
  async uploadJSON(data: Record<string, unknown>): Promise<IPFSUploadResult> {
    try {
      const jsonString = JSON.stringify(data, Object.keys(data).sort());
      const buffer = Buffer.from(jsonString, "utf-8");

      return await this.uploadBuffer(buffer, "application/json");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[IPFS] Upload JSON failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload binary content to IPFS
   */
  async uploadBuffer(buffer: Buffer, contentType?: string): Promise<IPFSUploadResult> {
    try {
      // Create multipart form data
      const boundary = "----IPFSBoundary" + crypto.randomBytes(16).toString("hex");

      const formData = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="upload"`,
        contentType ? `Content-Type: ${contentType}` : "",
        "",
        buffer.toString("binary"),
        `--${boundary}--`,
      ]
        .filter(Boolean)
        .join("\r\n");

      const response = await fetch(`${this.config.apiUrl}/api/v0/add?pin=true`, {
        method: "POST",
        headers: {
          ...this.headers,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IPFS API error: ${response.status} - ${errorText}`);
      }

      const result = (await response.json()) as { Hash: string; Size: string };

      const cid = result.Hash;
      const gatewayUrl = this.config.gatewayUrl || "https://ipfs.io";

      return {
        success: true,
        cid,
        uri: `ipfs://${cid}`,
        size: parseInt(result.Size, 10),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[IPFS] Upload buffer failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload a file from base64 content
   */
  async uploadBase64(
    base64Content: string,
    contentType?: string
  ): Promise<IPFSUploadResult> {
    const buffer = Buffer.from(base64Content, "base64");
    return this.uploadBuffer(buffer, contentType);
  }

  /**
   * Retrieve content from IPFS by CID
   */
  async retrieve(cid: string): Promise<IPFSRetrieveResult> {
    try {
      // Normalize CID (remove ipfs:// prefix if present)
      const normalizedCid = cid.replace(/^ipfs:\/\//, "");

      const response = await fetch(`${this.config.apiUrl}/api/v0/cat?arg=${normalizedCid}`, {
        method: "POST",
        headers: this.headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IPFS retrieve error: ${response.status} - ${errorText}`);
      }

      const data = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") || "application/octet-stream";

      return {
        success: true,
        data,
        contentType,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[IPFS] Retrieve failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Retrieve and parse JSON content from IPFS
   */
  async retrieveJSON<T = Record<string, unknown>>(cid: string): Promise<{
    success: boolean;
    data?: T;
    error?: string;
  }> {
    const result = await this.retrieve(cid);

    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    try {
      const data = JSON.parse(result.data.toString("utf-8")) as T;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: "Failed to parse JSON content" };
    }
  }

  /**
   * Pin content to ensure persistence
   */
  async pin(cid: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedCid = cid.replace(/^ipfs:\/\//, "");

      const response = await fetch(
        `${this.config.apiUrl}/api/v0/pin/add?arg=${normalizedCid}`,
        {
          method: "POST",
          headers: this.headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IPFS pin error: ${response.status} - ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[IPFS] Pin failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Unpin content
   */
  async unpin(cid: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedCid = cid.replace(/^ipfs:\/\//, "");

      const response = await fetch(
        `${this.config.apiUrl}/api/v0/pin/rm?arg=${normalizedCid}`,
        {
          method: "POST",
          headers: this.headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IPFS unpin error: ${response.status} - ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[IPFS] Unpin failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check pin status for a CID
   */
  async getPinStatus(cid: string): Promise<PinStatus | null> {
    try {
      const normalizedCid = cid.replace(/^ipfs:\/\//, "");

      const response = await fetch(
        `${this.config.apiUrl}/api/v0/pin/ls?arg=${normalizedCid}`,
        {
          method: "POST",
          headers: this.headers,
        }
      );

      if (!response.ok) {
        return { cid: normalizedCid, pinned: false };
      }

      const result = (await response.json()) as { Keys: Record<string, unknown> };

      return {
        cid: normalizedCid,
        pinned: Object.keys(result.Keys || {}).length > 0,
      };
    } catch {
      return { cid, pinned: false };
    }
  }

  /**
   * Get IPFS gateway URL for a CID
   */
  getGatewayUrl(cid: string): string {
    const normalizedCid = cid.replace(/^ipfs:\/\//, "");
    const gateway = this.config.gatewayUrl || "https://ipfs.io";
    return `${gateway}/ipfs/${normalizedCid}`;
  }

  /**
   * Calculate the CID for content without uploading
   * Useful for verifying content integrity
   */
  async calculateCID(content: Buffer): Promise<string | null> {
    try {
      // Use the IPFS add with only-hash flag
      const boundary = "----IPFSBoundary" + crypto.randomBytes(16).toString("hex");

      const formData = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="upload"`,
        "",
        content.toString("binary"),
        `--${boundary}--`,
      ].join("\r\n");

      const response = await fetch(
        `${this.config.apiUrl}/api/v0/add?pin=false&only-hash=true`,
        {
          method: "POST",
          headers: {
            ...this.headers,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        return null;
      }

      const result = (await response.json()) as { Hash: string };
      return result.Hash;
    } catch {
      return null;
    }
  }

  /**
   * Check service health
   */
  async healthCheck(): Promise<{
    connected: boolean;
    version?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/v0/version`, {
        method: "POST",
        headers: this.headers,
      });

      if (!response.ok) {
        return { connected: false, error: `HTTP ${response.status}` };
      }

      const result = (await response.json()) as { Version: string };

      return {
        connected: true,
        version: result.Version,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { connected: false, error: errorMessage };
    }
  }
}

// Singleton instance
let ipfsServiceInstance: IPFSService | null = null;

/**
 * Get or create the IPFS service instance
 */
export function getIPFSService(): IPFSService | null {
  if (ipfsServiceInstance) {
    return ipfsServiceInstance;
  }

  const apiUrl = process.env.IPFS_API_URL;

  if (!apiUrl) {
    console.warn("[IPFS] Service not configured. Set IPFS_API_URL.");
    return null;
  }

  ipfsServiceInstance = new IPFSService({
    apiUrl,
    projectId: process.env.IPFS_PROJECT_ID,
    projectSecret: process.env.IPFS_PROJECT_SECRET,
    gatewayUrl: process.env.IPFS_GATEWAY_URL || "https://ipfs.io",
  });

  return ipfsServiceInstance;
}

/**
 * Create an IPFS service for a specific provider
 */
export function createIPFSService(config: IPFSConfig): IPFSService {
  return new IPFSService(config);
}

// Predefined configurations for common providers
export const IPFS_PROVIDERS = {
  infura: (projectId: string, projectSecret: string): IPFSConfig => ({
    apiUrl: "https://ipfs.infura.io:5001",
    projectId,
    projectSecret,
    gatewayUrl: "https://ipfs.io",
  }),

  pinata: (apiKey: string, secretKey: string): IPFSConfig => ({
    apiUrl: "https://api.pinata.cloud",
    projectId: apiKey,
    projectSecret: secretKey,
    gatewayUrl: "https://gateway.pinata.cloud",
  }),

  local: (port = 5001): IPFSConfig => ({
    apiUrl: `http://127.0.0.1:${port}`,
    gatewayUrl: `http://127.0.0.1:8080`,
  }),
};
