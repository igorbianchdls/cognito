import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import localFont from "next/font/local";
import { clerkPtBrLocalization } from "@/products/auth/frontend/components/ClerkAuthShell";
import "./globals.css";
import "@/products/erp/frontend/styles/workspace.css";
import "@/products/erp/frontend/styles/dashboards.css";

const geistSans = localFont({ src: [{ path: "../fonts/geist.woff2", weight: "100 900", style: "normal" }], variable: "--font-geist-sans", display: "swap" });

const geistMono = localFont({ src: [{ path: "../fonts/geist-mono.woff2", weight: "100 900", style: "normal" }], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Otto",
  description: "Gestão empresarial simples para pequenas empresas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        <ClerkProvider localization={clerkPtBrLocalization} taskUrls={{ 'choose-organization': '/entrando' }}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
