export const ENV = {
  appId: process.env.VITE_APP_ID || "abfi-dev-app",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // HeyGen AI Avatar Configuration
  heygenApiKey: process.env.HEYGEN_API_KEY ?? "",
  heygenAvatarId: process.env.HEYGEN_AVATAR_ID ?? "sam_australian_001",
};
