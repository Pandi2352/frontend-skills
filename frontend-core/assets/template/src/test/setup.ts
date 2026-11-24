import '@testing-library/jest-dom/vitest';

// jsdom has no layout, so these browser features are missing.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
URL.createObjectURL ??= () => 'blob:test';
URL.revokeObjectURL ??= () => {};
