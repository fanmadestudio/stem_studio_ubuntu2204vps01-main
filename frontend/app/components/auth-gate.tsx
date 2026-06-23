"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { usePathname, useRouter } from "../lib/router";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAuth(): Promise<void> {
      const isLoginRoute = pathname === "/login";
      let validSession = false;
      try {
        await apiFetch("/api/v1/auth/me/");
        validSession = true;
      } catch {
        validSession = false;
      }

      if (!active) return;

      if (!validSession && !isLoginRoute) {
        router.replace("/login");
        setAllowed(false);
        return;
      }

      if (validSession && isLoginRoute) {
        router.replace("/");
        setAllowed(false);
        return;
      }

      setAllowed(true);
    }

    setAllowed(false);
    void checkAuth();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!allowed) return null;

  return <>{children}</>;
}
