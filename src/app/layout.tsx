import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: { default: "Oxford 2068 Circle", template: "%s · Oxford 2068 Circle" },
  description:
    "Private Dhukuti and shared-savings records for Oxford 2068 Circle.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", manrope.variable)}>
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
