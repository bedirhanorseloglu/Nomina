import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";
import GlobalPomodoro from "@/components/GlobalPomodoro";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1cb0f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | KPSS2X — 2 Kat Hızlı Hazırlık",
    default: "KPSS2X — 2 Kat Hızlı KPSS Hazırlık Platformu",
  },
  description: "KPSS2X — 2 Kat Hızlı KPSS Hazırlık Platformu. Deneme analizleri, pomodoro, liderlik tablosu ve yapay zeka destekli hedef takibi.",
  keywords: ["KPSS2X", "KPSS 2026", "KPSS Çalışma", "Deneme Takibi", "Pomodoro", "KPSS Lisans", "Sınav Takip"],
  authors: [{ name: "KPSS2X Uzmanı" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/kpss2x_final_logo.png",
  },
  openGraph: {
    title: "KPSS2X — 2 Kat Hızlı KPSS Hazırlık Platformu",
    description: "Premium KPSS2X ders takip paneli. Kendi netlerini gir, rakiplerinle yarış, başarını 2'ye katla.",
    type: "website",
    locale: "tr_TR",
    siteName: "KPSS2X",
  },
  twitter: {
    card: "summary_large_image",
    title: "KPSS2X — 2 Kat Hızlı KPSS Hazırlık Platformu",
    description: "Premium KPSS2X ders takip paneli.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${nunito.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <ErrorBoundary>
              {children}
              <GlobalPomodoro />
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
        <Toaster
          position="top-center"
          expand={false}
          duration={3500}
          gap={10}
        />
      </body>
    </html>
  );
}
