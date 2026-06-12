export function getApiBase(): string {
  const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configuredBase) return configuredBase.replace(/\/+$/, "");

  if (typeof window === "undefined") {
    return "http://127.0.0.1:8000";
  }

  const { protocol, hostname } = window.location;

  if (hostname.endsWith(".csb.app")) {
    return `${protocol}//${hostname.replace(/-\d+\.csb\.app$/, "-8000.csb.app")}`;
  }

  return `${protocol}//${hostname}:8000`;
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

export async function apiFetchList<T>(path: string, init: RequestInit = {}): Promise<T[]> {
  const payload = await apiFetch<T[] | PaginatedResponse<T>>(path, init);
  if (Array.isArray(payload)) return payload;
  if (!payload || !Array.isArray(payload.results)) return [];

  const allResults: T[] = [...payload.results];
  let nextUrl = payload.next;

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
