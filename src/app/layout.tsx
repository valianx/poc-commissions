"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import { seedDatabase } from "@/seed/seed-data";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Seed database on first load
    seedDatabase();
  }, []);

  return (
    <html lang="es">
      <head>
        <title>Zippy POC - Commission Management Prototype</title>
        <meta name="description" content="Proof of concept for commission management system" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
