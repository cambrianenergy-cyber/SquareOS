import "./globals.css";
import { Manrope } from "next/font/google";
import ClientLayout from "./client-layout";
import type { Metadata } from 'next';

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Uqentra AI - Intelligent Orchestration Platform',
  description: 'Intelligent Orchestration Platform for modern businesses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
