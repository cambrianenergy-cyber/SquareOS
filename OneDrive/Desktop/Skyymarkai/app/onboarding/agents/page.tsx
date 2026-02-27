// SCREEN 5: CHOOSE AGENTS
"use client";

import React, { useState } from 'react';
import { setOnboardingStep } from '@/lib/onboardingState';
import { auth } from '@/lib/firebase';

const defaultAgents = [
  { key: 'content', name: 'Content Agent', enabled: true },
  { key: 'research', name: 'Research Agent', enabled: true },
  { key: 'social', name: 'Social Agent', enabled: true },
  { key: 'ops', name: 'Ops Agent', enabled: true },
];

export default function AgentsOnboarding() {
  const [agents, setAgents] = useState(defaultAgents);
  const [submitting, setSubmitting] = useState(false);

  function toggleAgent(key: string) {
    setAgents(agents => agents.map(a => a.key === key ? { ...a, enabled: !a.enabled } : a));
  }

  async function handleContinue() {
    setSubmitting(true);
    const user = auth.currentUser;
    if (!user) {
      window.location.href = '/login';
      return;
    }
    // TODO: Save agent selections to Firestore
    await setOnboardingStep(user.uid, 'first_run');
    window.location.href = '/onboarding/first_run';
  }

  return (
    <main className="onboarding-step">
      <h1>Choose Your Operators</h1>
      <div className="agent-cards">
        {agents.map(agent => (
          <div key={agent.key} style={{marginBottom: 12, border: '1px solid #ccc', padding: 12, borderRadius: 8}}>
            <span>{agent.name}</span>
            <label style={{marginLeft: 8}}>
              <input type="checkbox" checked={agent.enabled} onChange={() => toggleAgent(agent.key)} /> Enable
            </label>
          </div>
        ))}
      </div>
      <button disabled={submitting} onClick={handleContinue}>Continue</button>
      <div className="progress-bar">Step 5 of 7</div>
    </main>
  );
}
