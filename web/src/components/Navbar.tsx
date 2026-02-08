"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/src/components/AuthProvider";

const PROFILE_STORAGE_KEY = "leedsHack.profile";
const PROFILE_UPDATED_EVENT = "leedsHack.profile.updated";
const GUEST_NAME = "Guest";
const MORNING_GREETING = "Good Morning";
const EVENING_GREETING = "Good Evening";

const navLinks = [
  { href: "/profile", label: "Profile" },
  { href: "/request/new", label: "New Request" },
  { href: "/matches/r1", label: "Matches" },
  { href: "/inbox", label: "Inbox" },
  { href: "/connections/m1", label: "Connections" },
];

type WeatherNowResponse = {
  current?: {
    is_day?: number;
  };
};

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6 ? EVENING_GREETING : MORNING_GREETING;
}

export function Navbar() {
  const { session, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState(GUEST_NAME);
  const [greeting, setGreeting] = useState<string>(getTimeBasedGreeting);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getSessionName = () => {
      const rawSessionName = session?.displayName ?? "";
      const sessionName = rawSessionName.trim();
      return sessionName || GUEST_NAME;
    };

    if (!session) {
      setDisplayName(GUEST_NAME);
      return;
    }

    const readDisplayName = () => {
      try {
        const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (!raw) {
          setDisplayName(getSessionName());
          return;
        }

        const parsed = JSON.parse(raw) as { name?: unknown };
        const nextName =
          typeof parsed.name === "string" ? parsed.name.trim() : "";
        setDisplayName(nextName || getSessionName());
      } catch {
        setDisplayName(getSessionName());
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === PROFILE_STORAGE_KEY) {
        readDisplayName();
      }
    };

    const handleProfileUpdated = () => {
      readDisplayName();
    };

    readDisplayName();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    const setGreetingFromTime = () => {
      setGreeting(getTimeBasedGreeting());
    };

    const setGreetingFromWeather = async (
      latitude: number,
      longitude: number,
    ) => {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current: "is_day",
      });

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather");
        }

        const payload = (await response.json()) as WeatherNowResponse;
        if (cancelled) return;

        if (payload.current?.is_day === 0) {
          setGreeting(EVENING_GREETING);
          return;
        }

        if (payload.current?.is_day === 1) {
          setGreeting(MORNING_GREETING);
          return;
        }

        setGreetingFromTime();
      } catch {
        if (!cancelled) {
          setGreetingFromTime();
        }
      }
    };

    setGreetingFromTime();

    if (!session) return;

    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void setGreetingFromWeather(
          position.coords.latitude,
          position.coords.longitude,
        );
      },
      () => {
        if (!cancelled) {
          setGreetingFromTime();
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 6500,
        maximumAge: 15 * 60 * 1000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
                  {greeting} {displayName}
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm font-medium text-white/80">
                  Welcome, {GUEST_NAME}
                </span>
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full bg-leeds-teal px-4 py-2 text-sm font-semibold text-leeds-blue-dark shadow-sm transition-transform hover:bg-leeds-teal-dark hover:scale-105 active:scale-95"
                >
                  Sign In
                </Link>
              </div>
            )
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden inline-flex items-center justify-center rounded-md p-1 text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-leeds-teal focus-visible:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden border-t border-white/15 bg-leeds-blue/95 backdrop-blur-md"
        >
          <nav className="container mx-auto flex flex-col px-4 py-3 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="container mx-auto border-t border-white/10 px-4 py-3 sm:px-6">
            {!isLoading &&
              (session ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-white/90"
                  >
                    {greeting} {displayName}
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20 active:scale-95"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-medium text-white/80">
                    Welcome, {GUEST_NAME}
                  </span>
                  <Link
                    href="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center rounded-full bg-leeds-teal px-4 py-2 text-sm font-semibold text-leeds-blue-dark shadow-sm transition-transform hover:bg-leeds-teal-dark active:scale-95"
                  >
                    Sign In
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}
    </header>
  );
}
