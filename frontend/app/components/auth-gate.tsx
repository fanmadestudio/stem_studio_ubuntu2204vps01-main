"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "../lib/router";

const AUTH_NAME_KEY = "studio_name";
const AUTH_EXPIRY_KEY = "auth_expires_at";

function hasValidSession(): boolean {
  const accessToken = localStorage.getItem("access");
  const name =
    localStorage.getItem("user_name") ??
    localStorage.getItem("username") ??
    localStorage.getItem("name") ??
    localStorage.getItem(AUTH_NAME_KEY);

  if (!name || !accessToken) return false;

  const rawExpiry = localStorage.getItem(AUTH_EXPIRY_KEY);
  const parsedExpiry = rawExpiry ? Number(rawExpiry) : NaN;
  if (!Number.isFinite(parsedExpiry)) return false;

  return parsedExpiry > Date.now();
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const isLoginRoute = pathname === "/login";
    const validSession = hasValidSession();

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
  }, [pathname, router]);

  if (!allowed) return null;

  return <>{children}</>;
}
