"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import AdminFounderDashboard from "../../components/AdminFounderDashboard";

export default function FounderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isFounder, setIsFounder] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/user/role?userId=${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          // Check if user has founder claim or founder role
          if (data.founder === true || data.globalRole === 'founder') {
            setIsFounder(true);
            // Set founder cookie for middleware
            document.cookie = 'isFounder=true; path=/;';
          } else {
            // Not a founder, redirect to main app
            router.push('/app');
          }
        } else {
          // API error, redirect to login
          router.push('/login');
        }
      } catch (err) {
        console.error('[FounderPage] Auth check failed:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
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
        <img src="/logo.svg" alt="Logo" style={{ width: 80, height: 80, marginBottom: 24 }} />
        <p style={{ fontSize: 18, color: '#64748b' }}>Verifying founder access...</p>
      </div>
    );
  }

  if (!isFounder) {
    return null;
  }

  return <AdminFounderDashboard />;
}
