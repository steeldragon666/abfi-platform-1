// Simple cookie options interface to avoid type conflicts
interface SessionCookieOptions {
  domain: string | undefined;
  httpOnly: boolean;
  path: string;
  sameSite: "strict" | "lax" | "none";
  secure: boolean;
}

function isSecureRequest(req: any): boolean {
  if (req.protocol === "https") return true;

  const forwardedProto = req.get?.("x-forwarded-proto") || req.headers?.["x-forwarded-proto"];
  if (!forwardedProto) return false;

  return String(forwardedProto).split(",").some((p: string) => p.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(req: any): SessionCookieOptions {
  const isSecure = isSecureRequest(req);
  return {
    domain: undefined,
    httpOnly: true,
    path: "/",
    // Use "lax" for CSRF protection while allowing top-level navigation
    // "none" requires secure context, "lax" is the secure default
    sameSite: isSecure ? "lax" : "lax",
    secure: isSecure,
  };
}
