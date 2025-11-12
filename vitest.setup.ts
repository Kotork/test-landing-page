import "@testing-library/jest-dom/vitest";

if (!globalThis.crypto?.randomUUID) {
  const randomUUID = () =>
    "00000000-0000-4000-8000-000000000000".replace(/0/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );

  // @ts-expect-error augment crypto for test runtime
  globalThis.crypto = {
    ...(globalThis.crypto ?? {}),
    randomUUID,
  };
}

if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserver {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      // no-op for tests
    }
    unobserve() {
      // no-op
    }
    disconnect() {
      // no-op
    }
  }

  // @ts-expect-error: assign polyfill for testing environment
  globalThis.ResizeObserver = ResizeObserver;
}

