import type { Metadata } from "next";
import { Toaster } from "sonner";
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
    <html lang="tr">
      <body className="antialiased min-h-screen flex flex-col">
        {children}
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
