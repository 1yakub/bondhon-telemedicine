import axios, { AxiosError } from "axios";

/**
 * One axios instance for the Laravel session API, the Sanctum SPA way: the session
 * cookie travels with every call (withCredentials) and axios copies the XSRF-TOKEN
 * cookie into the X-XSRF-TOKEN header on its own (withXSRFToken).
 */
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: "application/json" },
});

let csrfReady: Promise<unknown> | null = null;

/** Fetches the CSRF cookie once per page load, before the first state changing call. */
export function ensureCsrf() {
  csrfReady ??= axios.get("/sanctum/csrf-cookie", { withCredentials: true }).catch(() => {
    csrfReady = null;
  });
  return csrfReady;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (method !== "get" && method !== "head") await ensureCsrf();
  return config;
});

export type ApiError = {
  status?: number;
  message: string;
  errors: Record<string, string[]>;
};

/** Turns any thrown value into a message plus per field errors the forms can show. */
export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
    const data = e.response?.data;
    const errors = data?.errors ?? {};
    const first = Object.values(errors)[0]?.[0];
    return {
      status: e.response?.status,
      message: first ?? data?.message ?? (e.response ? `Request failed (${e.response.status}).` : "No connection to the server."),
      errors,
    };
  }
  return { message: "Something went wrong.", errors: {} };
}
