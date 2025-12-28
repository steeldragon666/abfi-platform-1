/**
 * Emissions Router - Carbon emissions tracking
 */
import { emissionsRouter } from "../../../server/emissionsRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const emissionsOnlyRouter = router({ emissions: emissionsRouter });

export default createServerRouterHandler(emissionsOnlyRouter, "/api/trpc/routers/emissions");
