/**
 * Evidence Vault Router - Blockchain evidence operations
 */
import { evidenceVaultRouter } from "../../../server/evidenceVaultRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const evidenceVaultOnlyRouter = router({ evidenceVault: evidenceVaultRouter });

export default createServerRouterHandler(evidenceVaultOnlyRouter, "/api/trpc/routers/evidenceVault");
