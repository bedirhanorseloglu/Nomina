import type { Metadata } from "next";
import AuthGuard from "@/components/auth/AuthGuard";
import FloatingNavbar from "@/components/layout/FloatingNavbar";

export const metadata: Metadata = {
  title: "KPSS 2026 Komuta Merkezi — Etkinlikler",
  description: "Premium KPSS 2026 pratik ve etkinlik paneli",
};

export default function EtkinlikLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <FloatingNavbar />
      {/* Etkinlikler page.tsx already has pt-28, so we don't need to add padding here */}
      <div className="min-h-screen">
        {children}
      </div>
    </AuthGuard>
  );
}
