import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AlertBanner from "@/components/AlertBanner";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LogisticAI",
  description: "Predict. Reroute. Deliver.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} antialiased bg-gray-950 text-white min-h-screen flex flex-col`}
      >
        <Header />
        <AlertBanner />
        <main className="flex-1 flex flex-col">{children}</main>
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
