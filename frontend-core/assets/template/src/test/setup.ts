import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// The first drawing of a page is slow on busy computers and in CI.
configure({ asyncUtilTimeout: 5000 });

// jsdom has no layout, so these browser features are missing.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
URL.createObjectURL ??= () => 'blob:test';
URL.revokeObjectURL ??= () => {};
