/**
 * Demand Signals Router - Buyer demand signal operations
 */
import { demandSignalsRouter } from "../../../server/demandSignalsRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const demandSignalsOnlyRouter = router({ demandSignals: demandSignalsRouter });

export default createServerRouterHandler(demandSignalsOnlyRouter, "/api/trpc/routers/demandSignals");
