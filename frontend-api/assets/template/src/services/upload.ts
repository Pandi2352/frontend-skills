import { env } from '@/config/env';
import { api } from './api';
import { buildUrl } from './api-client';
import { ApiError, apiText, toApiError } from './api-error';
import { session } from './session';

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
  fieldName?: string;
}

// fetch cannot report upload progress, so this one uses XMLHttpRequest.
function send(path: string, file: File, options: UploadOptions, token: string | null) {
  return new Promise<Response>((resolve, reject) => {
    const { signal, onProgress, fieldName = 'file' } = options;
    const cancelled = () => new DOMException('Upload cancelled', 'AbortError');
    if (signal?.aborted) return reject(cancelled());
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    signal?.addEventListener('abort', abort, { once: true });

    request.open('POST', buildUrl(env.apiUrl, path));
    request.withCredentials = true;
    request.setRequestHeader('Accept', 'application/json');
    if (token) request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.upload.onprogress = (e) => e.lengthComputable && onProgress?.((e.loaded / e.total) * 100);
    request.onabort = () => reject(cancelled());
    request.onerror = () => reject(new ApiError(apiText.network, { kind: 'network' }));
    request.onload = () =>
      resolve(
        new Response(request.status === 204 ? null : request.responseText, {
          status: request.status,
          headers: { 'content-type': request.getResponseHeader('content-type') ?? '' },
        }),
      );
    request.onloadend = () => signal?.removeEventListener('abort', abort);

    const form = new FormData();
    form.append(fieldName, file);
    request.send(form);
  });
}

export async function uploadFile(path: string, file: File, options: UploadOptions = {}): Promise<void> {
  let response = await send(path, file, options, session.getToken());
  if (response.status === 401) {
    const token = await api.refresh();
    if (token) response = await send(path, file, options, token);
    if (response.status === 401) session.end();
  }
  if (response.ok) return;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  throw toApiError(response, body);
}
