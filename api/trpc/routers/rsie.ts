/**
 * RSIE Router - Renewable/Sustainable Industry Energy operations
 */
import { rsieRouter } from "../../../server/rsieRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const rsieOnlyRouter = router({ rsie: rsieRouter });

export default createServerRouterHandler(rsieOnlyRouter, "/api/trpc/routers/rsie");
