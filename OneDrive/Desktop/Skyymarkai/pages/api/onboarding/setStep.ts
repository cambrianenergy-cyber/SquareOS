// API route to set onboarding step, with RBAC check
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, adminAuth } from '@/lib/firebaseAdmin';

// Helper to get user role from users/{uid}.role
async function getUserRole(userId: string): Promise<string | null> {
  const userSnap = await db.collection('users').doc(userId).get();
  return userSnap.exists ? userSnap.data()?.role || null : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const { userId, step } = req.body;
    if (!userId || !step) return res.status(400).json({ error: 'Missing userId or step' });

    // Verify auth token
    let authed;
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization as string;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Missing or invalid Authorization header");
      }
      const idToken = authHeader.substring("Bearer ".length);
      authed = await adminAuth.verifyIdToken(idToken);
    } catch (e: any) {
      return res.status(401).json({ error: 'Unauthorized', details: e.message });
    }

    // Only allow users to update their own state
    if (authed.uid !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const role = await getUserRole(userId);
    if (role === 'viewer') return res.status(403).json({ error: 'Viewers cannot update onboarding state' });
    
    await db.collection('onboarding_states').doc(userId).set({ state: step }, { merge: true });
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('Error in setStep API:', err);
    res.status(500).json({ error: 'Internal server error', details: err?.message || err });
  }
}
