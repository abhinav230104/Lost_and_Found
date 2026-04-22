import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, DM_Serif_Display, Geist } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lost & Found",
  description: "Campus lost and found platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmSerif.variable} ${geist.variable} h-full antialiased`}
    >
      <body className={cn("min-h-[100dvh] flex flex-col bg-background text-foreground font-sans", geist.className)}>
        <Suspense fallback={<main className="min-h-[100dvh]" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
