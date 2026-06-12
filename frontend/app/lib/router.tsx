import { AnchorHTMLAttributes, createContext, MouseEvent, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

type RouterContextValue = {
  pathname: string;
  searchParams: URLSearchParams;
  push: (href: string) => void;
  replace: (href: string) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);

function normalizePathname(): string {
  const pathname = window.location.pathname.replace(/\/+$/, "");
  return pathname || "/";
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [locationKey, setLocationKey] = useState(() => `${normalizePathname()}${window.location.search}`);

  const syncLocation = useCallback(() => {
    setLocationKey(`${normalizePathname()}${window.location.search}`);
  }, []);

  useEffect(() => {
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, [syncLocation]);

  const navigate = useCallback(
    (href: string, mode: "push" | "replace") => {
      if (mode === "push") {
        window.history.pushState(null, "", href);
      } else {
        window.history.replaceState(null, "", href);
      }
      syncLocation();
    },
    [syncLocation],
  );

  const value = useMemo<RouterContextValue>(() => {
    const url = new URL(window.location.href);
    return {
      pathname: normalizePathname(),
      searchParams: url.searchParams,
      push: (href) => navigate(href, "push"),
      replace: (href) => navigate(href, "replace"),
    };
  }, [locationKey, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouterContext(): RouterContextValue {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("Router hooks must be used inside RouterProvider.");
  }
  return context;
}

export function useRouter() {
  const { push, replace } = useRouterContext();
  return useMemo(() => ({ push, replace }), [push, replace]);
}

export function usePathname(): string {
  return useRouterContext().pathname;
}

export function useSearchParams(): URLSearchParams {
  return useRouterContext().searchParams;
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const params: Record<string, string> = {};

  if (segments[0] === "invoices" && segments[1]) {
    params.id = segments[1];
  }

  if (segments[0] === "monthly-report" && segments[1] && segments[1] !== "invoices") {
    params.month = segments[1];
  }

  if (segments[0] === "monthly-report" && segments[1] === "invoices" && segments[2]) {
    params.id = segments[2];
  }

  return params as T;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export function Link({ href, onClick, children, ...props }: LinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      props.target === "_blank" ||
      href.startsWith("http") ||
      href.startsWith("mailto:")
    ) {
      return;
    }

    event.preventDefault();
    router.push(href);
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
