import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";
import GlobalPomodoro from "@/components/GlobalPomodoro";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "KPSS 2026 Komuta Merkezi",
  description: "Premium KPSS 2026 ders takip paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
            <GlobalPomodoro />
          </AuthProvider>
        </ThemeProvider>
        <Toaster
          position="bottom-center"
          closeButton
          expand={false}
          duration={3000}
          toastOptions={{
            classNames: {
              toast: "app-toast",
            },
          }}
        />
      </body>
    </html>
  );
}
