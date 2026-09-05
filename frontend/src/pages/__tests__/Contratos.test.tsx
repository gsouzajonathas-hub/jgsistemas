import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  contractsAPI: {
    list: vi.fn(),
    pdf: vi.fn(() => Promise.resolve({ data: new Blob() })),
    sign: vi.fn(() => Promise.resolve({ data: {} })),
    cancel: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import { contractsAPI } from '../../services/api';
import Contratos from '../Contratos';

const baseContract = {
  id: 1,
  student_id: 5,
  student_name: 'Aluno Teste',
  plan_name: 'Plano Anual',
  course_name: 'Inglês',
  start_date: '2026-01-01',
  end_date: '2026-12-01',
  mode: 'installments' as const,
  installments_count: 12,
  final_value: 3600,
  total_due: 3600,
  status: 'pending' as const,
  signed_at: null,
  created_at: null,
};

const mockContracts = (data: any[]) => {
  (contractsAPI.list as any).mockResolvedValue({ data });
};

const renderPage = () => render(<MemoryRouter><Contratos /></MemoryRouter>);

describe('Contratos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (contractsAPI.pdf as any).mockResolvedValue({ data: new Blob() });
  });

  it('renderiza o título e a lista de contratos vinda da API', async () => {
    mockContracts([baseContract]);
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Contratos' })).toBeInTheDocument();
    expect(await screen.findByText('Aluno Teste')).toBeInTheDocument();
    expect(screen.getByText('Plano Anual')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Aguardando assinatura')).toBeInTheDocument();
    expect(contractsAPI.list).toHaveBeenCalled();
  });

  it('mostra estado vazio quando não há contratos', async () => {
    mockContracts([]);
    renderPage();
    expect(await screen.findByText('Nenhum contrato encontrado')).toBeInTheDocument();
  });

  it('filtra contratos pela busca de texto', async () => {
    mockContracts([
      baseContract,
      { ...baseContract, id: 2, student_name: 'Outro Aluno', plan_name: 'Plano Mensal' },
    ]);
    renderPage();

    await screen.findByText('Aluno Teste');
    expect(screen.getByText('Outro Aluno')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Pesquisar aluno, plano ou curso...'), { target: { value: 'Outro' } });

    expect(screen.queryByText('Aluno Teste')).not.toBeInTheDocument();
    expect(screen.getByText('Outro Aluno')).toBeInTheDocument();
  });

  it('assina um contrato pendente chamando contractsAPI.sign após confirmação', async () => {
    mockContracts([baseContract]);
    renderPage();

    fireEvent.click(await screen.findByTitle('Marcar como assinado'));
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, assinar' }));

    await waitFor(() => {
      expect(contractsAPI.sign).toHaveBeenCalledWith(1);
    });
  });

  it('cancela um contrato pendente chamando contractsAPI.cancel após confirmação', async () => {
    mockContracts([baseContract]);
    renderPage();

    fireEvent.click(await screen.findByTitle('Cancelar contrato'));
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, cancelar' }));

    await waitFor(() => {
      expect(contractsAPI.cancel).toHaveBeenCalledWith(1);
    });
  });
});
