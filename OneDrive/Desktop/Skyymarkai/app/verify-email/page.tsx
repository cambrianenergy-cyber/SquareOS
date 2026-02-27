"use client";

import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"pending" | "verified" | "error">("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // TODO: Implement email verification logic
    // For now, just show a placeholder
    setMessage("Email verification feature coming soon");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded text-blue-800">
          {message}
        </div>
      </div>
    </div>
  );
}
