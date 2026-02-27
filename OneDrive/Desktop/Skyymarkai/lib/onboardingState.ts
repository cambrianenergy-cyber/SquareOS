// Onboarding state logic for UI and server
import { auth } from './firebase';

// Always use API route for onboarding state (safe for both client and server)
export async function getOnboardingState(userId: string): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) return 'profile';
    const token = await user.getIdToken();
    const res = await fetch(`/api/onboarding/state?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return 'profile';
    const data = await res.json();
    return data.state || 'profile';
  } catch {
    return 'profile';
  }
}

export async function setOnboardingStep(userId: string, step: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('[setOnboardingStep] No authenticated user');
      return false;
    }
    const token = await user.getIdToken();
    const res = await fetch('/api/onboarding/setStep', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId, step })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to set onboarding step');
    }
    return true;
  } catch (err) {
    console.error('[setOnboardingStep] Failed:', err);
    return false;
  }
}

export async function completeOnboarding(userId: string) {
  // TODO: Implement API route for completing onboarding (use fetch to call it)
  return true;
}
