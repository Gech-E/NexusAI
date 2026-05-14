import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexus LearnAI | Smart Learning Platform",
  description: "Offline-first AI-powered education platform for schools and students.",
};

import { SyncManager } from "@/components/SyncManager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-50 min-h-screen`}>
        <SyncManager />
        {children}
      </body>
    </html>
  );
}
