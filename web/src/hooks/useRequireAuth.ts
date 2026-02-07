"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

/**
 * Call at the top of any protected page component.
 * Redirects to /auth if not authenticated.
 * Returns the session, or null while loading / redirecting.
 */
export function useRequireAuth() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth");
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) return null;
  return session;
}
