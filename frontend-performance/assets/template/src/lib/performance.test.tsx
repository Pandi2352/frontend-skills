import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RouteObject } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LazySection } from '@/components/shared/lazy-section';
import { VirtualList } from '@/components/shared/virtual-list';
import { Image } from '@/components/ui/image';
import { isPreloading, preloadOnIntent, preloadPath } from './preload-routes';
import { recoverFromStaleDeploy } from './stale-deploy';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('preload-routes', () => {
  const page = () => vi.fn().mockResolvedValue({ Component: () => null });

  it('loads every lazy level of a path once', async () => {
    const outer = page();
    const inner = page();
    const other = page();
    const routes: RouteObject[] = [
      { path: '/users', lazy: outer, children: [{ path: ':id', lazy: { Component: inner } }] },
      { path: '/other', lazy: other },
    ];
    await preloadPath(routes, '/users/7');
    await preloadPath(routes, '/users/8');
    expect(outer).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledTimes(1);
    expect(other).not.toHaveBeenCalled();
  });

  it('tries again after a failure', async () => {
    const lazy = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({});
    const routes: RouteObject[] = [{ path: '/a', lazy }];
    await preloadPath(routes, '/a');
    expect(isPreloading()).toBe(false);
    await preloadPath(routes, '/a');
    expect(lazy).toHaveBeenCalledTimes(2);
  });

  it('starts on hover and focus, and not for other sites or after cleanup', async () => {
    const first = page();
    const second = page();
    const stop = preloadOnIntent([{ path: '/first', lazy: first }, { path: '/second', lazy: second }]);
    render(
      <>
        <a href="/first"><span>First</span></a>
        <a href="/second">Second</a>
        <a href="https://example.com/second">Elsewhere</a>
      </>,
    );
    fireEvent.pointerOver(screen.getByText('First'));
    await waitFor(() => expect(first).toHaveBeenCalled());
    fireEvent.focusIn(screen.getByText('Elsewhere'));
    await new Promise((done) => setTimeout(done, 20));
    expect(second).not.toHaveBeenCalled();
    fireEvent.focusIn(screen.getByText('Second'));
    await waitFor(() => expect(second).toHaveBeenCalled());
    stop();
    fireEvent.pointerOver(screen.getByText('First'));
    expect(first).toHaveBeenCalledTimes(1);
  });
});

describe('recoverFromStaleDeploy', () => {
  const fail = () => window.dispatchEvent(new Event('vite:preloadError'));
  const setup = (to?: string) => {
    const go = vi.fn();
    const onStale = vi.fn();
    const router = {
      state: { navigation: { location: to ? { pathname: to } : undefined } },
      createHref: (l: { pathname: string }) => l.pathname,
    } as unknown as Parameters<typeof recoverFromStaleDeploy>[0];
    return { go, onStale, stop: recoverFromStaleDeploy(router, onStale, go) };
  };

  it('fully loads the page being opened, but never in a loop', () => {
    const { go, onStale, stop } = setup('/users');
    fail();
    fail();
    expect(go).toHaveBeenCalledTimes(1);
    expect(go).toHaveBeenCalledWith('/users');
    expect(onStale).not.toHaveBeenCalled();
    stop();
  });

  it('only tells when no page is being opened', () => {
    const { go, onStale, stop } = setup();
    fail();
    expect(onStale).toHaveBeenCalledTimes(1);
    expect(go).not.toHaveBeenCalled();
    stop();
    fail();
    expect(onStale).toHaveBeenCalledTimes(1);
  });
});

describe('Image', () => {
  it('reserves space and loads late, except the main image', () => {
    const { rerender } = render(<Image src="/a.webp" alt="Chart" width={400} height={300} />);
    const image = screen.getByRole('img', { name: 'Chart' });
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('width', '400');
    rerender(<Image src="/a.webp" alt="Chart" width={400} height={300} priority />);
    expect(screen.getByRole('img', { name: 'Chart' })).toHaveAttribute('loading', 'eager');
  });

  it('keeps its name when the file is missing, and tries a new file', () => {
    const { rerender, container } = render(<Image src="/gone.webp" alt="Chart" width={4} height={3} />);
    fireEvent.error(screen.getByRole('img', { name: 'Chart' }));
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Chart' })).toBeVisible();
    rerender(<Image src="/new.webp" alt="Chart" width={4} height={3} />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/new.webp');
  });
});

describe('VirtualList', () => {
  // jsdom has no layout.
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(50);
  });
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: `i${i}`, name: `Item ${i}` }));
  const base = { label: 'People', getKey: (i: { id: string }) => i.id, renderItem: (i: { name: string }) => i.name, className: 'h-96' };

  it('draws only what is visible, with the real position', () => {
    render(<VirtualList {...base} items={items} />);
    const drawn = screen.getAllByRole('listitem');
    expect(drawn.length).toBeGreaterThan(5);
    expect(drawn.length).toBeLessThan(40);
    expect(drawn[0]).toHaveAttribute('aria-posinset', '1');
    expect(drawn[0]).toHaveAttribute('aria-setsize', '1000');
  });

  it('loads more near the end, waits while loading, and retries on request', async () => {
    const onLoadMore = vi.fn();
    const few = items.slice(0, 6);
    const { rerender } = render(<VirtualList {...base} items={few} hasMore isLoadingMore onLoadMore={onLoadMore} />);
    expect(onLoadMore).not.toHaveBeenCalled();
    rerender(<VirtualList {...base} items={few} hasMore onLoadMore={onLoadMore} />);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(<VirtualList {...base} items={few} hasMore error="Offline" onLoadMore={onLoadMore} />);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });
});

describe('LazySection', () => {
  it('draws its content only when it is near', () => {
    let seen: (entries: { isIntersecting: boolean }[]) => void = () => undefined;
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: typeof seen) {
        seen = callback;
      }
      observe() {}
      disconnect = disconnect;
    });
    const draw = vi.fn(() => 'Chart');
    const Chart = () => draw();
    render(<LazySection fallback="Placeholder"><Chart /></LazySection>);
    expect(screen.getByText('Placeholder')).toBeVisible();
    expect(draw).not.toHaveBeenCalled();
    act(() => seen([{ isIntersecting: true }]));
    expect(screen.getByText('Chart')).toBeVisible();
    expect(disconnect).toHaveBeenCalled();
  });
});
