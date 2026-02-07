import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/src/components/Navbar";
import { Footer } from "@/src/components/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeedsHack 2026",
  description: "LeedsHack 2026 app shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} antialiased flex flex-col min-h-screen bg-leeds-cream text-leeds-blue-dark selection:bg-leeds-teal selection:text-leeds-blue-dark`}
      >
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
