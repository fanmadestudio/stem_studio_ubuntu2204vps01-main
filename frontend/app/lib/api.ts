export function getApiBase(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
  return `http://${host}:8000`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBase()}${path}`, { ...init, headers });
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
    const token = getAccessToken();
    const headers = new Headers(init.headers ?? {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetch(nextUrl, { ...init, headers });
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
