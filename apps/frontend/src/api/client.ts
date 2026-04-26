const defaultBackendUrl = "http://127.0.0.1:8000";

type DesktopApi = {
  backendUrl?: string;
};

export function getBackendUrl(): string {
  const desktopApi = (window as { desktopApi?: DesktopApi }).desktopApi;
  return (
    desktopApi?.backendUrl ??
    import.meta.env.VITE_BACKEND_URL ??
    defaultBackendUrl
  );
}

type ApiErrorBody = {
  detail?: string;
};

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getBackendUrl()}${path}`, init);

  if (!response.ok) {
    const errorBody: ApiErrorBody | null = await response
      .json()
      .catch(() => null);
    throw new Error(errorBody?.detail ?? "Request failed");
  }

  return response.json() as Promise<T>;
}
