import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KPSS 2026 Komuta Merkezi — Gösterge Paneli",
  description: "Premium KPSS 2026 ders takip ve planlama paneli",
};

import AuthGuard from "@/components/auth/AuthGuard";
import FloatingNavbar from "@/components/layout/FloatingNavbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <FloatingNavbar />
      <div className="pt-24 min-h-screen">
        {children}
      </div>
    </AuthGuard>
  );
}
