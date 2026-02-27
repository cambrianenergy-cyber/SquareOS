// ENTRY GATE: /onboarding
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getOnboardingState } from '@/lib/onboardingState';

export default function OnboardingEntry() {
  const router = useRouter();
  const [status, setStatus] = useState('Checking authentication...');

  useEffect(() => {
    let mounted = true;
    let timeout: NodeJS.Timeout | undefined;

    const checkAuth = async () => {
      try {
        // Wait for auth to initialize
        const authTimeout = await new Promise<void>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve();
          });
          // Timeout after 3 seconds
          timeout = setTimeout(() => {
            unsubscribe();
            resolve();
          }, 3000);
        });

        if (!mounted) return;

        const user = auth.currentUser;
        
        if (!user) {
          setStatus('No user found, redirecting to login...');
          console.log('[OnboardingEntry] No authenticated user, redirecting to login');
          setTimeout(() => router.push('/login'), 500);
          return;
        }

        // Set userId cookie for middleware
        document.cookie = `userId=${user.uid}; path=/;`;

        // Check if user is a founder - allow them to access freely
        const token = await user.getIdToken();
        const roleRes = await fetch(`/api/user/role?userId=${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          if (roleData.founder === true || roleData.globalRole === 'founder') {
            console.log('[OnboardingEntry] Founder detected - allowing free navigation');
            document.cookie = 'isFounder=true; path=/;';
            setStatus('Founder access granted - redirecting to profile...');
            setTimeout(() => router.replace('/onboarding/profile'), 500);
            return;
          }
        }

        setStatus('Loading onboarding state...');
        console.log('[OnboardingEntry] User authenticated:', user.uid);

        try {
          const state = await getOnboardingState(user.uid);
          console.log('[OnboardingEntry] Onboarding state:', state);

          if (!mounted) return;

          const routes: Record<string, string> = {
            profile: '/onboarding/profile',
            workspace: '/onboarding/workspace',
            team: '/onboarding/team',
            connect: '/onboarding/connect',
            agents: '/onboarding/agents',
            first_run: '/onboarding/first_run',
            done: '/app',
          };

          const route = routes[state] || '/onboarding/profile';
          setStatus(`Redirecting to ${state}...`);
          router.replace(route);
        } catch (err) {
          console.error('[OnboardingEntry] Failed to get onboarding state:', err);
          setStatus('Error loading state, redirecting to profile...');
          setTimeout(() => router.replace('/onboarding/profile'), 1000);
        }
      } catch (err) {
        console.error('[OnboardingEntry] Auth check failed:', err);
        setStatus('Authentication failed, redirecting to profile...');
        setTimeout(() => router.replace('/onboarding/profile'), 1000);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [router]);

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      minHeight: '50vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <p style={{ fontSize: 18, color: '#64748b' }}>{status}</p>
      <div style={{ 
        marginTop: 20,
        width: 200,
        height: 4,
        background: 'linear-gradient(90deg, #1976d2, #7c3aed, #1976d2)',
        backgroundSize: '200% 100%',
        animation: 'loading 1.5s ease-in-out infinite',
        borderRadius: 2
      }} />
      <style jsx>{`
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
