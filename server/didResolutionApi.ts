/**
 * ABFI DID Resolution API
 * Implements W3C DID Resolution specification
 *
 * Endpoints:
 * - GET /.well-known/did.json - Universal resolver discovery
 * - GET /.well-known/did/:controllerType/:controllerId - DID document resolution
 * - GET /1.0/identifiers/:did - Universal resolver compatible endpoint
 */

import { Router, Request, Response } from "express";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import { didRegistry } from "../drizzle/schema";
import { getIPFSService } from "./services/ipfs";

const router = Router();

async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return drizzle(process.env.DATABASE_URL);
}

// DID Resolution Response interface
interface DidResolutionResult {
  "@context": string;
  didDocument: Record<string, unknown> | null;
  didResolutionMetadata: {
    contentType: string;
    error?: string;
    errorMessage?: string;
    retrieved?: string;
  };
  didDocumentMetadata: {
    created?: string;
    updated?: string;
    deactivated?: boolean;
  };
}

/**
 * Universal Resolver Discovery
 * GET /.well-known/did.json
 */
router.get("/.well-known/did.json", (_req: Request, res: Response) => {
  const configuration = {
    "@context": "https://identity.foundation/.well-known/did-configuration/v1",
    linked_dids: [],
    supported_methods: ["did:web"],
    service_endpoint: `${process.env.BASE_URL || "https://abfi.io"}/api/did/1.0/identifiers`,
  };

  res.setHeader("Content-Type", "application/json");
  res.json(configuration);
});

/**
 * Resolve DID by controller path
 * GET /.well-known/did/:controllerType/:controllerId
 */
router.get(
  "/.well-known/did/:controllerType/:controllerId",
  async (req: Request, res: Response) => {
    try {
      const { controllerType, controllerId } = req.params;
      const controllerIdNum = parseInt(controllerId, 10);

      if (isNaN(controllerIdNum)) {
        return res.status(400).json({
          error: "invalidControllerId",
          message: "Controller ID must be a number",
        });
      }

      const db = await getDb();
      if (!db) {
        return res.status(503).json({
          error: "serviceUnavailable",
          message: "Database not available",
        });
      }

      const [record] = await db
        .select()
        .from(didRegistry)
        .where(
          and(
            eq(didRegistry.controllerType, controllerType as any),
            eq(didRegistry.controllerId, controllerIdNum),
            eq(didRegistry.status, "active")
          )
        )
        .limit(1);

      if (!record) {
        return res.status(404).json({
          error: "notFound",
          message: "DID not found for this controller",
        });
      }

      // Try to retrieve the DID document from IPFS
      let didDocument: Record<string, unknown> | null = null;

      if (record.didDocumentUri.startsWith("ipfs://")) {
        const ipfsService = getIPFSService();
        if (ipfsService) {
          const cid = record.didDocumentUri.replace("ipfs://", "");
          const result = await ipfsService.retrieveJSON(cid);
          if (result.success && result.data) {
            didDocument = result.data;
          }
        }
      }

      // If not on IPFS, construct a basic DID document
      if (!didDocument) {
        didDocument = {
          "@context": ["https://www.w3.org/ns/did/v1"],
          id: record.did,
          verificationMethod: [
            {
              id: `${record.did}#key-1`,
              type: "Ed25519VerificationKey2020",
              controller: record.did,
            },
          ],
          authentication: [`${record.did}#key-1`],
          assertionMethod: [`${record.did}#key-1`],
        };
      }

      res.setHeader("Content-Type", "application/did+json");
      res.json(didDocument);
    } catch (error) {
      console.error("[DID Resolution] Error:", error);
      res.status(500).json({
        error: "internalError",
        message: "Failed to resolve DID",
      });
    }
  }
);

/**
 * Universal Resolver Compatible Endpoint
 * GET /1.0/identifiers/:did
 */
router.get("/1.0/identifiers/:did", async (req: Request, res: Response) => {
  try {
    const { did } = req.params;

    // Validate DID format
    if (!did.startsWith("did:")) {
      return res.status(400).json(createErrorResponse("invalidDid", "Invalid DID format"));
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json(createErrorResponse("serviceUnavailable", "Database not available"));
    }

    const [record] = await db
      .select()
      .from(didRegistry)
      .where(eq(didRegistry.did, did))
      .limit(1);

    if (!record) {
      return res.status(404).json(createErrorResponse("notFound", "DID not found"));
    }

    // Check if deactivated
    if (record.status !== "active") {
      const response: DidResolutionResult = {
        "@context": "https://w3id.org/did-resolution/v1",
        didDocument: null,
        didResolutionMetadata: {
          contentType: "application/did+ld+json",
          error: "deactivated",
          errorMessage: `DID has been ${record.status}`,
        },
        didDocumentMetadata: {
          created: record.createdAt?.toISOString(),
          updated: record.revokedAt?.toISOString(),
          deactivated: true,
        },
      };
      return res.status(410).json(response);
    }

    // Try to retrieve the DID document from IPFS
    let didDocument: Record<string, unknown> | null = null;

    if (record.didDocumentUri.startsWith("ipfs://")) {
      const ipfsService = getIPFSService();
      if (ipfsService) {
        const cid = record.didDocumentUri.replace("ipfs://", "");
        const result = await ipfsService.retrieveJSON(cid);
        if (result.success && result.data) {
          didDocument = result.data;
        }
      }
    }

    // If not on IPFS, construct a basic DID document
    if (!didDocument) {
      didDocument = {
        "@context": [
          "https://www.w3.org/ns/did/v1",
          "https://w3id.org/security/suites/ed25519-2020/v1",
        ],
        id: record.did,
        controller: record.did,
        verificationMethod: [
          {
            id: `${record.did}#key-1`,
            type: "Ed25519VerificationKey2020",
            controller: record.did,
          },
        ],
        authentication: [`${record.did}#key-1`],
        assertionMethod: [`${record.did}#key-1`],
        capabilityInvocation: [`${record.did}#key-1`],
        capabilityDelegation: [`${record.did}#key-1`],
      };
    }

    const response: DidResolutionResult = {
      "@context": "https://w3id.org/did-resolution/v1",
      didDocument,
      didResolutionMetadata: {
        contentType: "application/did+ld+json",
        retrieved: new Date().toISOString(),
      },
      didDocumentMetadata: {
        created: record.createdAt?.toISOString(),
      },
    };

    res.setHeader("Content-Type", "application/did+ld+json");
    res.json(response);
  } catch (error) {
    console.error("[DID Resolution] Error:", error);
    res.status(500).json(createErrorResponse("internalError", "Failed to resolve DID"));
  }
});

/**
 * List all active DIDs (for debugging/admin)
 * GET /dids
 */
router.get("/dids", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Database not available" });
    }

    const records = await db
      .select({
        did: didRegistry.did,
        method: didRegistry.didMethod,
        controllerType: didRegistry.controllerType,
        controllerId: didRegistry.controllerId,
        status: didRegistry.status,
        createdAt: didRegistry.createdAt,
      })
      .from(didRegistry)
      .where(eq(didRegistry.status, "active"))
      .limit(100);

    res.json({
      count: records.length,
      dids: records,
    });
  } catch (error) {
    console.error("[DID Resolution] Error listing DIDs:", error);
    res.status(500).json({ error: "Failed to list DIDs" });
  }
});

/**
 * Health check endpoint
 * GET /health
 */
router.get("/health", async (_req: Request, res: Response) => {
  const db = await getDb();
  const ipfsService = getIPFSService();

  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: db ? "connected" : "disconnected",
    ipfs: ipfsService ? "configured" : "not_configured",
  };

  res.json(health);
});

// Helper function to create error responses
function createErrorResponse(error: string, message: string): DidResolutionResult {
  return {
    "@context": "https://w3id.org/did-resolution/v1",
    didDocument: null,
    didResolutionMetadata: {
      contentType: "application/did+ld+json",
      error,
      errorMessage: message,
    },
    didDocumentMetadata: {},
  };
}

export const didResolutionRouter = router;
