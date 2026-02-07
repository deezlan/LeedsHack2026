"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/profile", label: "Profile" },
  { href: "/request/new", label: "New Request" },
  { href: "/matches/r1", label: "Matches" },
  { href: "/inbox", label: "Inbox" },
  { href: "/connections/m1", label: "Connections" },
];

export function Navbar() {
  const { session, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-leeds-blue/90 backdrop-blur-md shadow-clay-card border-none supports-[backdrop-filter]:bg-leeds-blue/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Campus<span className="text-leeds-teal">Connect</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/80 transition-colors hover:text-white hover:underline hover:decoration-leeds-teal hover:underline-offset-4"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {!isLoading && (
            session ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/profile"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  {session.displayName}
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden md:inline-flex items-center justify-center rounded-full bg-leeds-teal px-4 py-2 text-sm font-semibold text-leeds-blue-dark shadow-sm transition-transform hover:bg-leeds-teal-dark hover:scale-105 active:scale-95"
              >
                Sign In
              </Link>
            )
          )}

          {/* Mobile Menu Button (Placeholder) */}
          <button className="md:hidden text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
