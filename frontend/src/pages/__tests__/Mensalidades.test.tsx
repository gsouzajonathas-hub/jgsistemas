import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  financialAPI: {
    generateMonth: vi.fn(() => Promise.resolve({ data: { message: 'ok' } })),
    getInstallments: vi.fn(() => Promise.resolve({ data: { installments: [], total: 0 } })),
    dashboard: vi.fn(() => Promise.resolve({ data: {} })),
    registerPayment: vi.fn(() => Promise.resolve({ data: {} })),
    receipt: vi.fn(() => Promise.resolve({ data: new Blob() })),
  },
}));

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { payment_methods: 'PIX,Dinheiro' },
    paymentMethods: ['PIX', 'Dinheiro'],
    refresh: vi.fn(),
  }),
}));

import { financialAPI } from '../../services/api';
import Mensalidades from '../Mensalidades';

const mockInstallments = (data: any[], total = data.length) => {
  (financialAPI.getInstallments as any).mockResolvedValue({ data: { installments: data, total } });
};

const renderPage = () => render(<MemoryRouter><Mensalidades /></MemoryRouter>);

describe('Mensalidades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (financialAPI.generateMonth as any).mockResolvedValue({ data: { message: 'ok' } });
    (financialAPI.dashboard as any).mockResolvedValue({ data: {} });
    (financialAPI.getInstallments as any).mockResolvedValue({ data: { installments: [], total: 0 } });
    (financialAPI.receipt as any).mockResolvedValue({ data: new Blob() });
  });

  it('renderiza o título e a lista de mensalidades vinda da API', async () => {
    mockInstallments([
      { id: 1, student_id: 5, student_name: 'Aluno Teste', description: 'Mensalidade Março', amount: 300, due_date: '2026-03-10', status: 'pending' },
    ]);

    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Mensalidades' })).toBeInTheDocument();
    expect(await screen.findByText('Aluno Teste')).toBeInTheDocument();
    expect(screen.getByText('Mensalidade Março')).toBeInTheDocument();
    expect(financialAPI.generateMonth).toHaveBeenCalled();
    expect(financialAPI.getInstallments).toHaveBeenCalled();
  });

  it('mostra estado vazio quando não há mensalidades', async () => {
    mockInstallments([]);
    renderPage();
    expect(await screen.findByText('Nenhuma mensalidade encontrada')).toBeInTheDocument();
  });

  it('altera o filtro de status e chama a API com o parâmetro correto', async () => {
    mockInstallments([]);
    renderPage();
    await screen.findByText('Nenhuma mensalidade encontrada');

    fireEvent.change(screen.getByDisplayValue('Todos os Status'), { target: { value: 'overdue' } });

    await waitFor(() => {
      expect(financialAPI.getInstallments).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'overdue' })
      );
    });
  });

  it('registra um pagamento chamando financialAPI.registerPayment e baixa o recibo', async () => {
    const createObjectSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    mockInstallments([
      { id: 7, student_id: 5, student_name: 'Aluno Teste', description: 'Mensalidade Abril', amount: 250, due_date: '2026-04-10', status: 'pending' },
    ]);
    (financialAPI.registerPayment as any).mockResolvedValue({ data: { payment_id: 99, receipt_number: 'REC-99' } });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Pagar/i }));
    expect(await screen.findByRole('heading', { name: 'Forma de Pagamento' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'PIX' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pagamento' }));

    await waitFor(() => {
      expect(financialAPI.registerPayment).toHaveBeenCalledWith(
        expect.objectContaining({ installment_id: 7, amount: 250, payment_method: 'PIX' })
      );
    });
    await waitFor(() => expect(financialAPI.receipt).toHaveBeenCalledWith(99));
    await waitFor(() => expect(clickSpy).toHaveBeenCalled());

    createObjectSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
