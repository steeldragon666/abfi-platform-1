/**
 * Sentiment Router - Market sentiment analysis
 */
import { sentimentRouter } from "../../../server/sentimentRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const sentimentOnlyRouter = router({ sentiment: sentimentRouter });

export default createServerRouterHandler(sentimentOnlyRouter, "/api/trpc/routers/sentiment");
