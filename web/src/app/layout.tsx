import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const navLinks = [
  { href: "/profile", label: "Profile" },
  { href: "/request/new", label: "New Request" },
  { href: "/matches/r1", label: "Matches (r1)" },
  { href: "/inbox", label: "Inbox" },
  { href: "/connections/m1", label: "Connection (m1)" },
];

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
          <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
              <Link
                href="/"
                className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                LeedsHack
              </Link>
              <nav className="flex flex-1 items-center gap-2 overflow-x-auto text-sm">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="whitespace-nowrap rounded-full px-3 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
