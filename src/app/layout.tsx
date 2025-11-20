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
        <title>Dashboard PROTOTYPE - Commission Management</title>
        <meta name="description" content="Prototype for commission management system" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
