type Primitive = string | number | boolean;

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function jsonHeaders(existing?: HeadersInit) {
  const headers = new Headers(existing);
  headers.set("Content-Type", "application/json");
  return headers;
}

function buildUrl(path: string, query?: Record<string, Primitive | null | undefined>) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
  });

  const body = await parseBody(res);

  if (!res.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? String((body as { error?: unknown }).error ?? "Request failed")
        : `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}

export function apiGet<T>(
  path: string,
  query?: Record<string, Primitive | null | undefined>,
  init?: RequestInit
) {
  return request<T>(buildUrl(path, query), { method: "GET", ...init });
}

export function apiPost<T>(path: string, body?: unknown, init?: RequestInit) {
  return request<T>(path, {
    ...init,
    method: "POST",
    headers: jsonHeaders(init?.headers),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body?: unknown, init?: RequestInit) {
  return request<T>(path, {
    ...init,
    method: "PATCH",
    headers: jsonHeaders(init?.headers),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiDelete<T>(path: string, init?: RequestInit) {
  return request<T>(path, { method: "DELETE", ...init });
}

export async function apiUploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<{
    message: string;
    url: string;
    fileName: string;
    size: number;
  }>("/api/upload/image", {
    method: "POST",
    body: formData,
  });
}
