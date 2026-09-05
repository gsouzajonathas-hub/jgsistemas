import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  reportsAPI: {
    dashboard: vi.fn(),
    activeStudents: vi.fn(),
    inactiveStudents: vi.fn(),
    overdue: vi.fn(),
    enrollments: vi.fn(),
    financial: vi.fn(),
    studentsExcel: vi.fn(() => Promise.resolve({ data: new Blob() })),
    studentsPDF: vi.fn(() => Promise.resolve({ data: new Blob() })),
    overdueExcel: vi.fn(() => Promise.resolve({ data: new Blob() })),
    overduePDF: vi.fn(() => Promise.resolve({ data: new Blob() })),
  },
}));

import { reportsAPI } from '../../services/api';
import Reports from '../Reports';

const renderPage = () => render(<MemoryRouter><Reports /></MemoryRouter>);

describe('Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (reportsAPI.studentsPDF as any).mockResolvedValue({ data: new Blob() });
    (reportsAPI.studentsExcel as any).mockResolvedValue({ data: new Blob() });
    (reportsAPI.overduePDF as any).mockResolvedValue({ data: new Blob() });
    (reportsAPI.overdueExcel as any).mockResolvedValue({ data: new Blob() });
  });

  it('renderiza o título e os cartões de relatórios disponíveis', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Relatórios' })).toBeInTheDocument();
    expect(screen.getByText('Alunos Ativos')).toBeInTheDocument();
    expect(screen.getByText('Inadimplentes')).toBeInTheDocument();
    expect(screen.getByText('Matrículas')).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
  });

  it('carrega o relatório de Alunos Ativos e exibe os dados retornados pela API', async () => {
    (reportsAPI.activeStudents as any).mockResolvedValue({
      data: [{ id: 1, full_name: 'Maria Silva', cpf: '111.222.333-44', phone: '(11) 90000-0000', english_level: 'Avançado' }],
    });
    renderPage();

    fireEvent.click(screen.getByText('Alunos Ativos'));

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Avançado')).toBeInTheDocument();
    expect(reportsAPI.activeStudents).toHaveBeenCalled();
  });

  it('baixa o relatório de Alunos Ativos em PDF chamando reportsAPI.studentsPDF', async () => {
    const createObjectSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    (reportsAPI.activeStudents as any).mockResolvedValue({ data: [] });
    renderPage();

    fireEvent.click(screen.getByText('Alunos Ativos'));
    const pdfBtn = await screen.findByRole('button', { name: /PDF/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => expect(reportsAPI.studentsPDF).toHaveBeenCalled());
    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(createObjectSpy).toHaveBeenCalled();

    createObjectSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('carrega o relatório Financeiro e exibe o resumo retornado pela API', async () => {
    (reportsAPI.financial as any).mockResolvedValue({
      data: {
        total_expected: 10000, total_received: 8000, total_overdue: 2000, monthly_income: 3000,
        count_pending: 4, count_overdue: 2, count_paid: 10,
      },
    });
    renderPage();

    fireEvent.click(screen.getByText('Financeiro'));

    expect(await screen.findByText('Total Esperado')).toBeInTheDocument();
    expect(screen.getByText('R$ 10.000')).toBeInTheDocument();
    expect(reportsAPI.financial).toHaveBeenCalled();
  });
});
