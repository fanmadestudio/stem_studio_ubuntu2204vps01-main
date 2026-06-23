export function getApiBase(): string {
  return import.meta.env.VITE_API_BASE_URL || "";
}

function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
  return value ? decodeURIComponent(value) : null;
}

function shouldSendCsrf(method: string | undefined): boolean {
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes((method ?? "GET").toUpperCase());
}

export async function ensureCsrfToken(): Promise<string | null> {
  const existingToken = getCookie("csrftoken");
  if (existingToken) return existingToken;

  const response = await fetch(`${getApiBase()}/api/v1/auth/csrf/`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  return getCookie("csrftoken");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (shouldSendCsrf(init.method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  const response = await fetch(`${getApiBase()}${path}`, { ...init, credentials: "include", headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type ListOptions = {
  allPages?: boolean;
};

export async function apiFetchPage<T>(path: string, init: RequestInit = {}): Promise<PaginatedResponse<T>> {
  const payload = await apiFetch<T[] | PaginatedResponse<T>>(path, init);
  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      next: null,
      previous: null,
      results: payload,
    };
  }
  if (!payload || !Array.isArray(payload.results)) {
    return { count: 0, next: null, previous: null, results: [] };
  }
  return payload;
}

export async function apiFetchList<T>(path: string, init: RequestInit = {}, options: ListOptions = {}): Promise<T[]> {
  const { allPages = false } = options;
  const page = await apiFetchPage<T>(path, init);
  if (!allPages) {
    return page.results;
  }

  const allResults: T[] = [...page.results];
  let nextUrl = page.next;

  while (nextUrl) {
    const headers = new Headers(init.headers ?? {});
    const response = await fetch(nextUrl, { ...init, credentials: "include", headers });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with status ${response.status}`);
    }
    const nextPayload = (await response.json()) as PaginatedResponse<T>;
    if (!Array.isArray(nextPayload.results)) break;
    allResults.push(...nextPayload.results);
    nextUrl = nextPayload.next;
  }

  return allResults;
}
