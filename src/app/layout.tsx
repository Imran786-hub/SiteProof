import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "SiteProof AI - Construction Evidence Verification",
  description: "AI-powered construction site evidence verification platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
