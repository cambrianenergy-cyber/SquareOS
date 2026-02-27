// SCREEN 7: COMPLETION
"use client";

import React, { useEffect } from 'react';
import { completeOnboarding } from '@/lib/onboardingState';
import { auth } from '@/lib/firebase';

export default function FinishOnboarding() {
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      completeOnboarding(user.uid);
    }
    // Set cookie and release middleware guard
    document.cookie = 'uqentra_onboarded=1; path=/;';
  }, []);

  function goToDashboard() {
    window.location.href = '/dashboard';
  }

  return (
    <main className="onboarding-step">
      <h1>You’re Live!</h1>
      <div className="summary">You’ve unlocked the full dashboard, admin controls, agents, and automation.</div>
      <button onClick={goToDashboard}>Go to Dashboard</button>
      <div className="progress-bar">Step 7 of 7</div>
    </main>
  );
}
