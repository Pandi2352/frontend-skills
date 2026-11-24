import { ApiError, apiText, toApiError } from './api-error';

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  query?: Record<string, QueryValue | QueryValue[]> | undefined;
  signal?: AbortSignal | undefined;
  headers?: Record<string, string> | undefined;
  timeoutMs?: number | undefined;
  /** For login, refresh and other public calls. */
  skipAuth?: boolean | undefined;
}

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => string | null;
  /** New token, or null when the session is really over. Throws on network failure. */
  refresh: () => Promise<string | null>;
  onSessionEnd: () => void;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}

export function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']) {
  // The token must never go to another host.
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new Error(`API path must start with a single "/": ${path}`);
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== null && item !== undefined && item !== '') params.append(key, String(item));
    }
  }
  const text = params.toString();
  return `${baseUrl}${path}${text ? `?${text}` : ''}`;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  if (!/json/i.test(response.headers.get('content-type') ?? '')) return text;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function createApiClient(config: ApiClientConfig) {
  let refreshing: Promise<string | null> | null = null;

  /** Many parallel 401s share one refresh. */
  const refreshOnce = () => {
    refreshing ??= config.refresh().finally(() => {
      refreshing = null;
    });
    return refreshing;
  };

  async function send(method: string, path: string, body: unknown, options: RequestOptions, token: string | null) {
    const isForm = body instanceof FormData;
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), options.timeoutMs ?? config.timeoutMs ?? 30_000);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout.signal]) : timeout.signal;
    try {
      const response = await (config.fetch ?? globalThis.fetch)(buildUrl(config.baseUrl, path, options.query), {
        method,
        signal,
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
          ...(token && !options.skipAuth ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        ...(body === undefined ? {} : { body: isForm ? body : JSON.stringify(body) }),
      });
      return { response, data: await readBody(response) };
    } catch (error) {
      // Cancelled by the caller: not a failure to show.
      if (options.signal?.aborted) throw error;
      if (timeout.signal.aborted) throw new ApiError(apiText.timeout, { kind: 'timeout' });
      throw new ApiError(apiText.network, { kind: 'network' });
    } finally {
      clearTimeout(timer);
    }
  }

  async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const used = config.getToken();
    let result = await send(method, path, body, options, used);

    if (result.response.status === 401 && !options.skipAuth) {
      const current = config.getToken();
      // Another request may have refreshed already.
      const token = current !== used && current ? current : await refreshOnce();
      if (token) result = await send(method, path, body, options, token);
      if (result.response.status === 401) config.onSessionEnd();
    }
    if (!result.response.ok) throw toApiError(result.response, result.data);
    return result.data as T;
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
    delete: <T = void>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
    refresh: refreshOnce,
  };
}
