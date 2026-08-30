import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  classesAPI: { list: vi.fn(() => Promise.resolve({ data: [] })) },
  boletinsAPI: {
    students: vi.fn(() => Promise.resolve({ data: [{ id: 1, full_name: 'Aluno Teste', english_level: 'Básico', status: 'active' }] })),
    get: vi.fn(),
    turma: vi.fn(),
    pdf: vi.fn(),
    excel: vi.fn(),
    turmaPdf: vi.fn(),
    turmaExcel: vi.fn(),
  },
  certificatesAPI: { issue: vi.fn() },
}));

import Boletim from '../Boletim';

describe('Boletim', () => {
  it('renderiza o título e a lista de alunos no seletor', async () => {
    render(<MemoryRouter><Boletim /></MemoryRouter>);
    expect(await screen.findByRole('heading', { level: 1, name: 'Boletim' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Aluno Teste/ })).toBeInTheDocument();
  });
});