"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

export default function FounderNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 9999,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    transition: 'all 0.2s',
  };

  const activeStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'rgba(255,255,255,0.35)',
  };

  const isOnboarding = pathname?.startsWith('/onboarding');
  const isApp = pathname?.startsWith('/app');
  const isFounder = pathname?.startsWith('/founder');

  return (
    <nav style={navStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="/logo.svg" alt="Logo" style={{ height: 24, filter: 'brightness(0) invert(1)' }} />
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Founder Mode</span>
      </div>
      
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          style={isOnboarding ? activeStyle : buttonStyle}
          onClick={() => router.push('/onboarding')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = isOnboarding ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)'}
        >
          Onboarding
        </button>
        <button
          style={isApp ? activeStyle : buttonStyle}
          onClick={() => router.push('/app')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = isApp ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)'}
        >
          Workspace
        </button>
        <button
          style={isFounder ? activeStyle : buttonStyle}
          onClick={() => router.push('/founder')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = isFounder ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)'}
        >
          Admin
        </button>
      </div>
    </nav>
  );
}
