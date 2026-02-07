import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusConnect",
  description: "CampusConnect - The community platform for changes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} antialiased flex flex-col min-h-screen text-leeds-blue-dark selection:bg-leeds-teal selection:text-leeds-blue-dark relative`}
      >
        {/* Background Image Setup */}
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute inset-0 bg-leeds-cream/90 backdrop-blur-[2px]" />
          {/* 
            Background Image:
            1. To use a local image: Place 'campus-bg.webp' in 'public/' and change src to "/campus-bg.webp"
            2. Current: Using a high-quality placeholder from Unsplash
          */}
          <img
            src="https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=1974&auto=format&fit=crop"
            alt="Campus Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-leeds-cream via-transparent to-transparent" />
        </div>

        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
