import { getAccessToken, setAccessToken } from "./token-store";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
const API_VERSION = "/api/v1";

async function request(path: string, init?: RequestInit): Promise<Response> {
  const token = getAccessToken();
  return fetch(`${API_BASE_URL}${API_VERSION}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = request(API_ENDPOINTS.AUTH.REFRESH, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          setAccessToken(null);
          return false;
        }
        const body = await res.json();
        setAccessToken(body.data.accessToken as string);
        return true;
      })
      .catch(() => {
        setAccessToken(null);
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const NO_RETRY_PATHS: string[] = [
  API_ENDPOINTS.AUTH.REFRESH,
  API_ENDPOINTS.AUTH.LOGIN,
];

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  allowRetry = true
): Promise<T> {
  const res = await request(path, init);

  if (res.status === 401 && allowRetry && !NO_RETRY_PATHS.includes(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, init, false);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body?.message ?? `API request failed: ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  const res = await request(path);

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryRes = await request(path);
      if (!retryRes.ok) throw new Error(`Export failed: ${retryRes.status}`);
      return retryRes.blob();
    }
  }

  if (!res.ok) {
    throw new Error(`Export failed: ${res.status}`);
  }

  return res.blob();
}

export { refreshAccessToken };
