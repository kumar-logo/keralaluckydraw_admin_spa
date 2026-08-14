import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

if (typeof window !== 'undefined') {
  const nativeGetComputedStyle = window.getComputedStyle?.bind(window);
  Object.defineProperty(window, 'getComputedStyle', {
    configurable: true,
    writable: true,
    value: (element: Element, pseudoElt?: string | null) => {
      if (nativeGetComputedStyle && !pseudoElt) {
        return nativeGetComputedStyle(element);
      }
      return {
        getPropertyValue: () => '',
        width: '',
        height: '',
      } as unknown as CSSStyleDeclaration;
    },
  });
}

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver;
}
