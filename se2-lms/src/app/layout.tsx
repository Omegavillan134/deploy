import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: true });

export const metadata: Metadata = {
  title: "CVSU LMS — Cavite State University Learning Management System",
  description:
    "CVSU LMS — run classes, submit coursework, track grades, and manage attendance. The learning platform for Cavite State University.",
};

export const viewport: Viewport = {
  themeColor: "#2e7d32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />
        <link rel="icon" href="/favicon.png?v=3" type="image/png" />
      </head>
      <body suppressHydrationWarning>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
