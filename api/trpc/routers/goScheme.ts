/**
 * GO Scheme Router - Guarantee of Origin operations
 */
import { goSchemeRouter } from "../../../server/goSchemeRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const goSchemeOnlyRouter = router({ goScheme: goSchemeRouter });

export default createServerRouterHandler(goSchemeOnlyRouter, "/api/trpc/routers/goScheme");
