// Testes da página Carnês (geração de carnês de pagamento/parcelamento).
// Padrão: vi.mock('../../services/api') stub de todas as APIs usadas pela página,
// vi.mock('../../hooks/useSettings') para não disparar settingsAPI real.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  carnesAPI: {
    list: vi.fn(() => Promise.resolve({ data: { carnets: [], total: 0 } })),
    get: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
    stats: vi.fn(() => Promise.resolve({ data: null })),
    registerPayment: vi.fn(),
    carnePDF: vi.fn(),
  },
  studentsAPI: {
    list: vi.fn(() => Promise.resolve({ data: { students: [] } })),
  },
  enrollmentsAPI: {
    list: vi.fn(() => Promise.resolve({ data: { enrollments: [] } })),
  },
  financialAPI: {
    receipt: vi.fn(),
  },
}));

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { payment_methods: 'PIX,Dinheiro,Débito,Crédito' },
    paymentMethods: ['PIX', 'Dinheiro', 'Débito', 'Crédito'],
    refresh: vi.fn(),
  }),
  pushSettingsCache: vi.fn(),
  parsePaymentMethods: (raw?: string) => (raw || 'PIX,Dinheiro,Débito,Crédito').split(',').map((m) => m.trim()).filter(Boolean),
}));

import Carnes from '../Carnes';
import { carnesAPI, studentsAPI, enrollmentsAPI } from '../../services/api';

const mockCarne = {
  id: 5,
  student_id: 10,
  student_name: 'Maria Silva',
  paid_count: 2,
  overdue_count: 1,
  pending_count: 3,
  total_installments: 6,
  status: 'overdue',
  first_due_date: '2026-09-10',
  total_amount: 1200,
};

const mockStats = {
  total_carnets: 3,
  total_to_receive: 3600,
  total_received: 1200,
  total_open: 1800,
  total_overdue: 600,
};

const mockList = (carnets: any[], total = carnets.length) => {
  (carnesAPI.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { carnets, total } });
};
const mockStatsResp = (stats: any) => {
  (carnesAPI.stats as ReturnType<typeof vi.fn>).mockResolvedValue({ data: stats });
};

const renderCarnes = () => render(<Carnes />, { wrapper: MemoryRouter });

describe('Carnes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList([]);
    mockStatsResp(null);
  });

  it('renderiza o título, os cards de resumo e a lista de carnês mockada', async () => {
    mockList([mockCarne], 3);
    mockStatsResp(mockStats);

    renderCarnes();

    expect(await screen.findByRole('heading', { level: 1, name: 'Carnês' })).toBeInTheDocument();
    expect(await screen.findByText('3 carnê(s) encontrado(s)')).toBeInTheDocument();
    expect(await screen.findByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('2/6')).toBeInTheDocument();
    // "R$ 1.200,00" aparece tanto no valor total da linha quanto no card "Total Recebido"
    expect(screen.getAllByText('R$ 1.200,00').length).toBeGreaterThanOrEqual(2);
    // "Em Atraso" aparece tanto no card de resumo quanto no badge de status da linha
    expect(screen.getAllByText('Em Atraso').length).toBeGreaterThanOrEqual(2);
    // Cards de resumo vindos de stats
    expect(screen.getByText('Carnês Emitidos')).toBeInTheDocument();
    expect(screen.getByText('R$ 3.600,00')).toBeInTheDocument();
    expect(carnesAPI.list).toHaveBeenCalled();
    expect(carnesAPI.stats).toHaveBeenCalled();
  });

  it('mostra estado vazio quando não há carnês', async () => {
    mockList([], 0);
    renderCarnes();
    expect(await screen.findByText('Nenhum carnê encontrado')).toBeInTheDocument();
    expect(screen.getByText('0 carnê(s) encontrado(s)')).toBeInTheDocument();
  });

  it('clicar no card "Em Atraso" filtra a lista chamando carnesAPI.list com status overdue', async () => {
    mockList([mockCarne], 1);
    mockStatsResp(mockStats);
    renderCarnes();

    await screen.findByText('Maria Silva');
    fireEvent.click(screen.getByRole('button', { name: /Em Atraso/i }));

    await waitFor(() => {
      expect(carnesAPI.list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'overdue' }));
    });
  });

  it('cria um novo carnê buscando aluno e chamando carnesAPI.create com o payload correto', async () => {
    (studentsAPI.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { students: [{ id: 1, full_name: 'João Souza', cpf: '111.222.333-44', monthly_fee: 300 }] },
    });
    (enrollmentsAPI.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { enrollments: [] } });
    (carnesAPI.create as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 99 } });

    renderCarnes();
    await screen.findByRole('heading', { level: 1, name: 'Carnês' });

    fireEvent.click(screen.getByRole('button', { name: /Novo Carnê/i }));
    expect(await screen.findByText('Novo Carnê')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Buscar aluno por nome...');
    fireEvent.change(searchInput, { target: { value: 'João' } });

    const studentBtn = await screen.findByText('João Souza');
    fireEvent.click(studentBtn);

    const descInput = await screen.findByPlaceholderText('Ex: Carnê 2024 - Mensalidade');
    fireEvent.change(descInput, { target: { value: 'Carnê Teste' } });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Carnê' }));

    await waitFor(() => {
      expect(carnesAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: 1,
          description: 'Carnê Teste',
          total_installments: 12,
          installment_value: 300,
        })
      );
    });
  });

  it('cancela um carnê via menu de ações após confirmação', async () => {
    mockList([{ ...mockCarne, status: 'active' }], 1);
    (carnesAPI.cancel as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

    renderCarnes();
    await screen.findByText('Maria Silva');

    fireEvent.click(screen.getByTitle('Mais opções'));
    fireEvent.click(await screen.findByText('Cancelar'));

    expect(await screen.findByText('Cancelar carnê')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Sim, cancelar/i }));

    await waitFor(() => {
      expect(carnesAPI.cancel).toHaveBeenCalledWith(5);
    });
  });

  it('abre detalhe do carnê e imprime o PDF chamando carnesAPI.carnePDF', async () => {
    mockList([mockCarne], 1);
    (carnesAPI.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { student_name: 'Maria Silva', installments: [] },
    });
    (carnesAPI.carnePDF as ReturnType<typeof vi.fn>).mockResolvedValue({ data: new Blob(['%PDF']) });
    const createObjectSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderCarnes();
    await screen.findByText('Maria Silva');

    fireEvent.click(screen.getByTitle('Visualizar'));

    expect(await screen.findByText('Carnê #0005')).toBeInTheDocument();
    expect(carnesAPI.get).toHaveBeenCalledWith(5);

    fireEvent.click(screen.getByRole('button', { name: /Imprimir Carnê/i }));

    await waitFor(() => {
      expect(carnesAPI.carnePDF).toHaveBeenCalledWith(5);
    });
    expect(createObjectSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalled();

    createObjectSpy.mockRestore();
    openSpy.mockRestore();
  });

  it('registra o pagamento de uma parcela chamando carnesAPI.registerPayment com a forma escolhida', async () => {
    mockList([mockCarne], 1);
    (carnesAPI.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        student_name: 'Maria Silva',
        late_fee_pct: 2,
        interest_daily_pct: 0.033,
        installments: [
          { id: 50, installment_num: 1, due_date: '2026-09-10', amount: 200, status: 'pending' },
        ],
      },
    });
    (carnesAPI.registerPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

    renderCarnes();
    await screen.findByText('Maria Silva');
    fireEvent.click(screen.getByTitle('Visualizar'));

    await screen.findByText('Carnê #0005');
    fireEvent.click(screen.getByRole('button', { name: /Pagar/i }));

    expect(await screen.findByText('Registrar Pagamento')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'PIX' }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pagamento/i }));

    await waitFor(() => {
      expect(carnesAPI.registerPayment).toHaveBeenCalledWith(
        5,
        50,
        expect.objectContaining({ payment_method: 'PIX', amount: 200 })
      );
    });
  });
});
