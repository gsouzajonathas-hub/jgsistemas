import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '../components/ui/Button';
import { formatDate } from '../utils/format';

describe('smoke do harness', () => {
  it('renderiza o Button com o texto do children', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('formatDate converte ISO para DD-MM-YYYY', () => {
    expect(formatDate('2026-08-29')).toBe('29-08-2026');
    expect(formatDate(null)).toBe('-');
  });
});