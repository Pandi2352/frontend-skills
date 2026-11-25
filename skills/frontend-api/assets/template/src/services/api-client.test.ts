import { describe, expect, it, vi } from 'vitest';
import { buildUrl, createApiClient } from './api-client';
import { ApiError } from './api-error';

const json = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

function setup(answer: (url: string, init: RequestInit) => Response | Promise<Response>) {
  let token: string | null = 'old';
  const fetch = vi.fn(async (url: unknown, init?: RequestInit) => answer(String(url), init ?? {}));
  const refresh = vi.fn(async (): Promise<string | null> => {
    await Promise.resolve();
    token = 'new';
    return token;
  });
  const onSessionEnd = vi.fn();
  const api = createApiClient({
    baseUrl: 'https://api.test', getToken: () => token, refresh, onSessionEnd, fetch: fetch as typeof globalThis.fetch,
  });
  return { api, fetch, refresh, onSessionEnd };
}
const sentToken = (init: RequestInit) => (init.headers as Record<string, string>).Authorization;

describe('buildUrl', () => {
  it('adds query values and skips empty ones', () => {
    expect(buildUrl('https://a.b', '/x', { q: 'a b', page: 0, none: null, empty: '', tag: ['1', '2'] })).toBe(
      'https://a.b/x?q=a+b&page=0&tag=1&tag=2',
    );
  });
  it.each(['https://evil.test', '//evil.test', 'users', '/\\evil.test'])('refuses %s', (path) => {
    expect(() => buildUrl('https://a.b', path)).toThrow();
  });
});

describe('api client', () => {
  it('sends JSON and the token, and reads JSON', async () => {
    const { api, fetch } = setup(() => json(200, { id: 1 }));
    await expect(api.post('/users', { name: 'A' })).resolves.toEqual({ id: 1 });
    const init = fetch.mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBe('{"name":"A"}');
    expect(sentToken(init)).toBe('Bearer old');
  });

  it('refreshes once for many 401s, then repeats each request', async () => {
    const { api, refresh, onSessionEnd, fetch } = setup((_url, init) =>
      sentToken(init) === 'Bearer new' ? json(200, 'ok') : json(401),
    );
    await expect(Promise.all([api.get('/a'), api.get('/b'), api.get('/c')])).resolves.toEqual(['ok', 'ok', 'ok']);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(6);
    expect(onSessionEnd).not.toHaveBeenCalled();
  });

  it('ends the session when refresh says no', async () => {
    const { api, refresh, onSessionEnd } = setup(() => json(401));
    refresh.mockResolvedValue(null);
    await expect(api.get('/a')).rejects.toMatchObject({ status: 401 });
    expect(onSessionEnd).toHaveBeenCalledTimes(1);
  });

  it('keeps the session when refresh fails because of the network', async () => {
    const { api, refresh, onSessionEnd } = setup(() => json(401));
    refresh.mockRejectedValue(new ApiError('offline', { kind: 'network' }));
    await expect(api.get('/a')).rejects.toMatchObject({ kind: 'network' });
    expect(onSessionEnd).not.toHaveBeenCalled();
  });

  it('does not refresh for public calls', async () => {
    const { api, refresh } = setup(() => json(401, { message: 'Email or password is incorrect' }));
    await expect(api.post('/auth/login', {}, { skipAuth: true })).rejects.toThrow('Email or password is incorrect');
    expect(refresh).not.toHaveBeenCalled();
  });

  it.each([
    [{ errors: { email: ['Taken', 'x'] } }],
    [{ fieldErrors: { email: 'Taken' } }],
    [{ errors: [{ field: 'email', message: 'Taken' }] }],
  ])('reads field errors from %j', async (body) => {
    const { api } = setup(() => json(422, body, { 'x-request-id': 'r1' }));
    await expect(api.post('/users', {})).rejects.toMatchObject({ fieldErrors: { email: 'Taken' }, requestId: 'r1' });
  });

  it('hides server details of a 500', async () => {
    const { api } = setup(() => json(500, { message: 'SQL error at line 3' }));
    await expect(api.get('/a')).rejects.toThrow('Something went wrong. Try again.');
  });

  it('reports network failure and timeout', async () => {
    const offline = setup(() => Promise.reject(new TypeError('failed')));
    await expect(offline.api.get('/a')).rejects.toMatchObject({ kind: 'network' });
    const slow = setup(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('x', 'AbortError')));
        }),
    );
    await expect(slow.api.get('/a', { timeoutMs: 10 })).rejects.toMatchObject({ kind: 'timeout' });
    const controller = new AbortController();
    const pending = slow.api.get('/a', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('accepts an empty answer', async () => {
    const { api } = setup(() => new Response(null, { status: 204 }));
    await expect(api.delete('/a')).resolves.toBeUndefined();
  });
});
