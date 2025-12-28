/**
 * Stealth Router - Stealth discovery operations
 */
import { stealthRouter } from "../../../server/stealthRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const stealthOnlyRouter = router({ stealth: stealthRouter });

export default createServerRouterHandler(stealthOnlyRouter, "/api/trpc/routers/stealth");
