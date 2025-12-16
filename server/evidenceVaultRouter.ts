import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import crypto from "crypto";
import {
  evidenceManifests,
  chainAnchors,
  merkleProofs,
} from "../drizzle/schema";

// ============================================================================
// EVIDENCE VAULT ROUTER - ABFI v3.1 Phase 1
// SHA-256 hashing, content-addressed storage, Merkle batching
// ============================================================================

async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return drizzle(process.env.DATABASE_URL);
}

// Helper: Compute SHA-256 hash
function computeSha256(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Helper: Build Merkle tree from leaf hashes
function buildMerkleTree(leaves: string[]): {
  root: string;
  proofPaths: Array<Array<{ hash: string; position: "left" | "right" }>>;
  depth: number;
} {
  if (leaves.length === 0) {
    return { root: "", proofPaths: [], depth: 0 };
  }

  // Pad to power of 2 if needed
  const paddedLeaves = [...leaves];
  while (paddedLeaves.length & (paddedLeaves.length - 1)) {
    paddedLeaves.push(paddedLeaves[paddedLeaves.length - 1]);
  }

  const tree: string[][] = [paddedLeaves];
  let currentLevel = paddedLeaves;

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left;
      const combined = left < right ? left + right : right + left;
      nextLevel.push(crypto.createHash("sha3-256").update(combined).digest("hex"));
    }
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  // Generate proof paths for each leaf
  const proofPaths: Array<Array<{ hash: string; position: "left" | "right" }>> = [];
  for (let leafIndex = 0; leafIndex < leaves.length; leafIndex++) {
    const path: Array<{ hash: string; position: "left" | "right" }> = [];
    let index = leafIndex;

    for (let level = 0; level < tree.length - 1; level++) {
      const isLeft = index % 2 === 0;
      const siblingIndex = isLeft ? index + 1 : index - 1;

      if (siblingIndex < tree[level].length) {
        path.push({
          hash: "0x" + tree[level][siblingIndex],
          position: isLeft ? "right" : "left",
        });
      }
      index = Math.floor(index / 2);
    }
    proofPaths.push(path);
  }

  return {
    root: "0x" + currentLevel[0],
    proofPaths,
    depth: tree.length - 1,
  };
}

// ============================================================================
// EVIDENCE VAULT ROUTER
// ============================================================================

export const evidenceVaultRouter = router({
  // Create manifest
  createManifest: protectedProcedure
    .input(
      z.object({
        docHashSha256: z.string().length(64),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        classification: z
          .enum(["public", "internal", "confidential", "restricted"])
          .default("internal"),
        sourceId: z.number().optional(),
        ingestionRunId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Build canonical manifest JSON
      const manifest = {
        version: "1.0",
        created: new Date().toISOString(),
        docHash: { algorithm: "sha256", value: input.docHashSha256 },
        file: { name: input.fileName, size: input.fileSize, mimeType: input.mimeType },
        classification: input.classification,
      };

      const manifestJson = JSON.stringify(manifest, Object.keys(manifest).sort());
      const manifestHash = computeSha256(manifestJson);
      const manifestUri = `ipfs://abfi-staging/${manifestHash}`;

      const [result] = await db.insert(evidenceManifests).values({
        manifestUri,
        manifestHashSha256: manifestHash,
        docHashSha256: input.docHashSha256,
        sourceId: input.sourceId || null,
        ingestionRunId: input.ingestionRunId || null,
        classification: input.classification,
        anchorStatus: "pending",
      });

      return {
        id: result.insertId,
        manifestUri,
        manifestHash,
        docHash: input.docHashSha256,
        status: "pending",
      };
    }),

  // Hash document
  hashDocument: protectedProcedure
    .input(z.object({ base64Content: z.string(), fileName: z.string() }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64Content, "base64");
      const hash = computeSha256(buffer);
      return { hash, fileName: input.fileName, fileSize: buffer.length, algorithm: "sha256" };
    }),

  // Get manifest by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [manifest] = await db
        .select()
        .from(evidenceManifests)
        .where(eq(evidenceManifests.id, input.id))
        .limit(1);

      return manifest || null;
    }),

  // Get manifest by document hash
  getByDocHash: protectedProcedure
    .input(z.object({ docHash: z.string().length(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [manifest] = await db
        .select()
        .from(evidenceManifests)
        .where(eq(evidenceManifests.docHashSha256, input.docHash))
        .limit(1);

      return manifest || null;
    }),

  // List pending manifests
  listPending: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(1000).default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(evidenceManifests)
        .where(eq(evidenceManifests.anchorStatus, "pending"))
        .orderBy(evidenceManifests.createdAt)
        .limit(input.limit);
    }),

  // Create batch anchor
  createBatchAnchor: protectedProcedure
    .input(
      z.object({
        manifestIds: z.array(z.number()).min(1).max(1000),
        chainId: z.number().default(1),
        chainName: z.string().default("ethereum"),
        contractAddress: z.string().length(42),
        batchPeriodStart: z.date(),
        batchPeriodEnd: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const manifests = await db
        .select()
        .from(evidenceManifests)
        .where(
          and(
            inArray(evidenceManifests.id, input.manifestIds),
            eq(evidenceManifests.anchorStatus, "pending")
          )
        );

      if (manifests.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No pending manifests found" });
      }

      const leaves = manifests.map(m => m.manifestHashSha256);
      const { root, proofPaths, depth } = buildMerkleTree(leaves);

      const [anchorResult] = await db.insert(chainAnchors).values({
        merkleRoot: root,
        merkleAlgorithm: "keccak256",
        leafCount: manifests.length,
        treeDepth: depth,
        chainId: input.chainId,
        chainName: input.chainName,
        contractAddress: input.contractAddress,
        status: "pending",
        batchType: "manual",
        batchPeriodStart: input.batchPeriodStart,
        batchPeriodEnd: input.batchPeriodEnd,
      });

      const anchorId = anchorResult.insertId;

      for (let i = 0; i < manifests.length; i++) {
        const manifest = manifests[i];

        await db.insert(merkleProofs).values({
          anchorId,
          manifestId: manifest.id,
          leafHash: "0x" + manifest.manifestHashSha256,
          leafIndex: i,
          proofPath: proofPaths[i],
        });

        await db
          .update(evidenceManifests)
          .set({ anchorStatus: "batched", anchorId })
          .where(eq(evidenceManifests.id, manifest.id));
      }

      return { anchorId, merkleRoot: root, leafCount: manifests.length, treeDepth: depth, status: "pending" };
    }),

  // Confirm anchor
  confirmAnchor: protectedProcedure
    .input(
      z.object({
        anchorId: z.number(),
        txHash: z.string().length(66),
        blockNumber: z.number(),
        blockTimestamp: z.date(),
        onChainAnchorId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await db
        .update(chainAnchors)
        .set({
          txHash: input.txHash,
          blockNumber: input.blockNumber,
          blockTimestamp: input.blockTimestamp,
          anchorId: input.onChainAnchorId,
          status: "confirmed",
          confirmedAt: new Date(),
        })
        .where(eq(chainAnchors.id, input.anchorId));

      await db
        .update(evidenceManifests)
        .set({ anchorStatus: "anchored" })
        .where(eq(evidenceManifests.anchorId, input.anchorId));

      return { success: true, anchorId: input.anchorId };
    }),

  // Get Merkle proof
  getMerkleProof: protectedProcedure
    .input(z.object({ manifestId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [proof] = await db
        .select({
          proof: merkleProofs,
          anchor: chainAnchors,
          manifest: evidenceManifests,
        })
        .from(merkleProofs)
        .innerJoin(chainAnchors, eq(merkleProofs.anchorId, chainAnchors.id))
        .innerJoin(evidenceManifests, eq(merkleProofs.manifestId, evidenceManifests.id))
        .where(eq(merkleProofs.manifestId, input.manifestId))
        .limit(1);

      if (!proof) return null;

      return {
        manifestHash: proof.manifest.manifestHashSha256,
        manifestUri: proof.manifest.manifestUri,
        leafHash: proof.proof.leafHash,
        leafIndex: proof.proof.leafIndex,
        proofPath: proof.proof.proofPath,
        merkleRoot: proof.anchor.merkleRoot,
        txHash: proof.anchor.txHash,
        blockNumber: proof.anchor.blockNumber,
        chainId: proof.anchor.chainId,
        chainName: proof.anchor.chainName,
        contractAddress: proof.anchor.contractAddress,
        verified: proof.anchor.status === "confirmed",
      };
    }),

  // Get anchor stats
  getAnchorStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return { totalManifests: 0, pendingManifests: 0, batchedManifests: 0, anchoredManifests: 0, totalAnchors: 0, confirmedAnchors: 0 };
    }

    const [manifestStats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`SUM(CASE WHEN anchorStatus = 'pending' THEN 1 ELSE 0 END)`,
        batched: sql<number>`SUM(CASE WHEN anchorStatus = 'batched' THEN 1 ELSE 0 END)`,
        anchored: sql<number>`SUM(CASE WHEN anchorStatus = 'anchored' THEN 1 ELSE 0 END)`,
      })
      .from(evidenceManifests);

    const [anchorStats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        confirmed: sql<number>`SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END)`,
      })
      .from(chainAnchors);

    return {
      totalManifests: manifestStats?.total || 0,
      pendingManifests: manifestStats?.pending || 0,
      batchedManifests: manifestStats?.batched || 0,
      anchoredManifests: manifestStats?.anchored || 0,
      totalAnchors: anchorStats?.total || 0,
      confirmedAnchors: anchorStats?.confirmed || 0,
    };
  }),
});

export type EvidenceVaultRouter = typeof evidenceVaultRouter;
