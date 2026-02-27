"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from "../components/Sidebar";
import { UserRoleProvider } from "../components/UserRoleContext";
import FounderNav from "../components/FounderNav";
import { auth } from "@/lib/firebase";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isFounder, setIsFounder] = useState(false);
  
  // Determine if we should show the sidebar (only for /app routes)
  const showSidebar = pathname?.startsWith('/app');
  
  useEffect(() => {
    const checkFounder = () => {
      const founderCookie = document.cookie.split('; ').find(row => row.startsWith('isFounder='));
      setIsFounder(founderCookie?.split('=')[1] === 'true');
    };
    
    checkFounder();
    
    // Also listen for auth changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch(`/api/user/role?userId=${user.uid}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.founder === true || data.globalRole === 'founder') {
              document.cookie = 'isFounder=true; path=/;';
              setIsFounder(true);
            }
          }
        } catch (err) {
          console.error('Failed to check founder status:', err);
        }
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <UserRoleProvider>
      {isFounder && <FounderNav />}
      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: isFounder ? 48 : 0 }}>
        {showSidebar && <Sidebar />}
        <div style={{ flex: 1, marginLeft: showSidebar ? 220 : 0 }}>
          {children}
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        </div>
      </div>
    </UserRoleProvider>
  );
}
