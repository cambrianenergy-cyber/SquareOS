import { adminAuth } from "./firebaseAdmin";

export interface AuthResult {
  uid: string;
  token: Record<string, unknown>;
}

export async function requireAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    throw new Error("Invalid Authorization header");
  }

  const decoded = await adminAuth.verifyIdToken(parts[1]);
  return { uid: decoded.uid, token: decoded as unknown as Record<string, unknown> };
}
