import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Reseta o cache do hook useSettings entre testes (cache é em nível de módulo).
beforeEach(() => {
  vi.resetModules();
});