"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { bindAuthListener, bootstrapSession } from "../lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    bindAuthListener();

    async function checkSession() {
      const isLoginRoute = pathname === "/login";
      const session = await bootstrapSession();
      const validSession = Boolean(session?.access_token);

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

    void checkSession();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!allowed) return null;

  return <>{children}</>;
}
