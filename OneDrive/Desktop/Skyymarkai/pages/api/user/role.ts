import { NextApiRequest, NextApiResponse } from "next";
import { db, adminAuth } from "@/lib/firebaseAdmin";

/**
 * GET /api/user/role?userId=<uid>&workspaceId=<ws>
 * Returns:
 * - global role info (founder claim if you use it)
 * - workspace role (owner/admin/member/viewer) if workspaceId provided
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = req.query.userId as string;
    const workspaceId = req.query.workspaceId as string | undefined;

    if (!userId) {
      return res.status(400).json({ ok: false, error: "Missing userId" });
    }

    // Require auth so random people can't query roles
    let authed;
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization as string;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Missing or invalid Authorization header");
      }
      const idToken = authHeader.substring("Bearer ".length);
      authed = await adminAuth.verifyIdToken(idToken);
    } catch (e: any) {
      return res.status(401).json({ ok: false, error: e.message || "Unauthorized" });
    }
    
    const isSelf = authed.uid === userId;
    if (!isSelf) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    // Use Firestore admin
    const userSnap = await db.collection("users").doc(userId).get();
    const user = userSnap.exists ? userSnap.data() : null;

    let workspaceRole: string | null = null;
    if (workspaceId) {
      const memberId = `${workspaceId}_${userId}`;
      const memberSnap = await db.collection("workspace_members").doc(memberId).get();
      if (memberSnap.exists) {
        const m = memberSnap.data() as any;
        if (m.status === "active") workspaceRole = m.role ?? null;
      }
    }

    return res.status(200).json({
      ok: true,
      userId,
      workspaceId: workspaceId ?? null,
      workspaceRole,
      globalRole: user?.globalRole ?? null,
      founder: user?.founder ?? null
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message ?? "Server error" });
  }
}
