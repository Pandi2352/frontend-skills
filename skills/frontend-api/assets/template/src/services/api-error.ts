export type ApiErrorKind = 'http' | 'network' | 'timeout';

interface ApiErrorDetails {
  kind: ApiErrorKind;
  status?: number | undefined;
  code?: string | undefined;
  fieldErrors?: Record<string, string> | undefined;
  requestId?: string | undefined;
  retryAfterSeconds?: number | undefined;
}

/** The only error shape the app sees from the server. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** 0 when there was no response. */
  readonly status: number;
  readonly code: string | undefined;
  /** Message per field; Form shows them below the fields. */
  readonly fieldErrors: Record<string, string>;
  readonly requestId: string | undefined;
  readonly retryAfterSeconds: number | undefined;

  constructor(message: string, details: ApiErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.kind = details.kind;
    this.status = details.status ?? 0;
    this.code = details.code;
    this.fieldErrors = details.fieldErrors ?? {};
    this.requestId = details.requestId;
    this.retryAfterSeconds = details.retryAfterSeconds;
  }
}

export const apiText = {
  network: 'Could not reach the server. Check your connection and try again.',
  timeout: 'The server took too long to answer. Try again.',
  unknown: 'Something went wrong. Try again.',
  byStatus: {
    400: 'Some of the information is not valid.',
    401: 'Your session has ended. Sign in again.',
    403: 'You do not have permission to do this.',
    404: 'This item could not be found.',
    409: 'This was changed by someone else. Reload and try again.',
    413: 'The file is too large.',
    422: 'Some of the information is not valid.',
    429: 'Too many requests. Wait a moment and try again.',
  } as Record<number, string>,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Accepts { field: "x" }, { field: ["x"] } and [{ field, message }]. */
function readFieldErrors(value: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!isRecord(item)) continue;
      const name = item.field ?? item.path;
      if (typeof name === 'string' && typeof item.message === 'string') result[name] ??= item.message;
    }
  } else if (isRecord(value)) {
    for (const [name, message] of Object.entries(value)) {
      const first: unknown = Array.isArray(message) ? message[0] : message;
      if (typeof first === 'string') result[name] = first;
    }
  }
  return result;
}

export function toApiError(response: Response, body: unknown): ApiError {
  const { status, headers } = response;
  const data = isRecord(body) ? body : {};
  // Server details of a 5xx are for developers, not for people.
  const said = status < 500 ? [data.message, data.detail, data.title].find((m) => typeof m === 'string') : undefined;
  const wait = Number(headers.get('retry-after'));
  return new ApiError(
    typeof said === 'string' && said ? said : (apiText.byStatus[status] ?? apiText.unknown),
    {
      kind: 'http',
      status,
      code: typeof data.code === 'string' ? data.code : undefined,
      fieldErrors: readFieldErrors(data.fieldErrors ?? data.errors),
      requestId: headers.get('x-request-id') ?? undefined,
      retryAfterSeconds: Number.isFinite(wait) && wait > 0 ? wait : undefined,
    },
  );
}

export const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === 'AbortError';

/** Safe text for people. */
export const getErrorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : apiText.unknown;
