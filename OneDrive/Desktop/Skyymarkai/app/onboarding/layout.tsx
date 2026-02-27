import React from "react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "24px 24px 0",
        }}
      >
        <img
          src="/logo.svg"
          alt="Uqentra logo"
          style={{ height: 48, width: "auto" }}
        />
      </header>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}
