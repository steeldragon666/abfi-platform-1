/**
 * VC Router - Verifiable Credentials operations
 */
import { vcRouter } from "../../../server/vcRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const vcOnlyRouter = router({ vc: vcRouter });

export default createServerRouterHandler(vcOnlyRouter, "/api/trpc/routers/vc");
