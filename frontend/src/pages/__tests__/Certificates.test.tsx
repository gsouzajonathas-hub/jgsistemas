import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  certificatesAPI: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
    student: vi.fn(),
    issue: vi.fn(),
    pdf: vi.fn(),
  },
  boletinsAPI: {
    students: vi.fn(() => Promise.resolve({ data: [] })),
    get: vi.fn(),
  },
}));

import Certificates from '../Certificates';

describe('Certificates', () => {
  it('renderiza o título e o estado vazio sem certificados', async () => {
    render(<MemoryRouter><Certificates /></MemoryRouter>);
    expect(await screen.findByRole('heading', { level: 1, name: 'Certificados' })).toBeInTheDocument();
    expect(await screen.findByText('Nenhum certificado')).toBeInTheDocument();
  });
});