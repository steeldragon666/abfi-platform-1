import type { Request } from "express";

// Simple cookie options interface to avoid type conflicts
interface SessionCookieOptions {
  domain: string | undefined;
  httpOnly: boolean;
  path: string;
  sameSite: "strict" | "lax" | "none";
  secure: boolean;
}

function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;

  const forwardedProto = req.get("x-forwarded-proto");
  if (!forwardedProto) return false;

  return forwardedProto.split(",").some((p: string) => p.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(req: Request): SessionCookieOptions {
  return {
    domain: undefined,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}
