import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  evaluationsAPI: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
    create: vi.fn(),
    bulk: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    average: vi.fn(),
  },
  enrollmentsAPI: { list: vi.fn(() => Promise.resolve({ data: [] })) },
  classesAPI: { list: vi.fn(() => Promise.resolve({ data: [] })) },
  weightConfigAPI: { list: vi.fn(() => Promise.resolve({ data: [] })) },
}));

import Evaluations from '../Evaluations';

describe('Evaluations', () => {
  it('renderiza o título e o estado vazio sem avaliações', async () => {
    render(<MemoryRouter><Evaluations /></MemoryRouter>);
    expect(await screen.findByRole('heading', { level: 1, name: 'Avaliações' })).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma avaliação cadastrada')).toBeInTheDocument();
  });
});