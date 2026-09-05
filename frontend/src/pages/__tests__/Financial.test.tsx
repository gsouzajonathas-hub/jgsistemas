// Teste-exemplo (T-01.03): renderiza Financeiro sem rede.
// Padrão replicável nas sprints seguintes:
//  1. vi.mock('../../services/api') — stub de TODOS os APis usados pela página
//  2. vi.mock('../../contexts/AuthContext') — useAuth com usuário fixo
//  3. vi.mock('../../hooks/useSettings') — sem disparar settingsAPI real
// Nenhuma chamada de rede acontece: tudo é resolvido pelos mocks.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  financialAPI: {
    generateMonth: vi.fn(() => Promise.resolve({ data: { message: 'ok' } })),
    getInstallments: vi.fn(() => Promise.resolve({ data: { installments: [], total: 0 } })),
    dashboard: vi.fn(() => Promise.resolve({ data: { total_received: 0 } })),
    receipt: vi.fn(() => Promise.resolve({ data: new Blob() })),
    registerPayment: vi.fn(),
    createInstallment: vi.fn(),
  },
  studentsAPI: {
    list: vi.fn(() => Promise.resolve({ data: { students: [] } })),
  },
  materialsAPI: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
    dashboard: vi.fn(() => Promise.resolve({ data: { total_materials: 0, total_sales: 0, total_revenue: 0, low_stock: 0 } })),
    listSales: vi.fn(() => Promise.resolve({ data: { sales: [], total: 0 } })),
    receipt: vi.fn(() => Promise.resolve({ data: new Blob() })),
  },
  settingsAPI: {
    get: vi.fn(() => Promise.resolve({ data: { school_name: 'Escola Teste', payment_methods: 'PIX,Dinheiro,Débito,Crédito' } })),
    update: vi.fn(),
    uploadLogo: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin Teste', email: 'admin@teste.local', role: 'admin' } }),
}));

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { school_name: 'Escola Teste', payment_methods: 'PIX,Dinheiro,Débito,Crédito' },
    paymentMethods: ['PIX', 'Dinheiro', 'Débito', 'Crédito'],
    refresh: vi.fn(),
  }),
  pushSettingsCache: vi.fn(),
  parsePaymentMethods: (raw?: string) => (raw || 'PIX,Dinheiro,Débito,Crédito').split(',').filter(Boolean),
}));

import Financial from '../Financial';
import { materialsAPI } from '../../services/api';

describe('Financial', () => {
  it('renderiza o cabeçalho e as três abas sem chamada real de rede', async () => {
    render(<Financial />);

    expect(await screen.findByRole('heading', { name: /Financeiro/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mensalidades/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Materiais Didáticos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vendas de Materiais/i })).toBeInTheDocument();
  });

  it('navega para a aba Vendas de Materiais usando o stub de materialsAPI', async () => {
    render(<Financial />);

    screen.getByRole('button', { name: /Vendas de Materiais/i }).click();
    expect(await screen.findByText('Vendas de Materiais')).toBeInTheDocument();
    expect(materialsAPI.listSales).toHaveBeenCalled();
  });

  it('botão Recibo na venda chama materialsAPI.receipt(id) e dispara o download (T-03.03)', async () => {
    const createObjectSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    (materialsAPI.listSales as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        total: 1,
        sales: [{
          id: 101,
          student_name: 'Aluno Teste',
          material_name: 'Apostila',
          quantity: 1,
          unit_price: 45.9,
          total_price: 45.9,
          payment_method: 'PIX',
          created_at: '2026-09-05T10:00:00',
        }],
      },
    });
    (materialsAPI.receipt as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
      headers: { 'content-disposition': 'attachment; filename="recibo-REC-2026-00001.pdf"' },
    });

    render(<Financial />);

    fireEvent.click(screen.getByRole('button', { name: /Vendas de Materiais/i }));
    const reciboBtn = await screen.findByRole('button', { name: /Recibo/i });
    expect(reciboBtn).toBeInTheDocument();

    fireEvent.click(reciboBtn);

    await waitFor(() => expect(materialsAPI.receipt).toHaveBeenCalledWith(101));
    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(createObjectSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();

    createObjectSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });
});