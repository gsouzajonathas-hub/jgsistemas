import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// jsdom não implementa ResizeObserver; recharts (usado no Dashboard) precisa dele.
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Reseta o cache do hook useSettings entre testes (cache é em nível de módulo).
beforeEach(() => {
  vi.resetModules();
});