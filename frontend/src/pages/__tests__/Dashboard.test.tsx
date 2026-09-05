import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  reportsAPI: {
    dashboard: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Maria Silva', email: 'maria@teste.com', role: 'admin' } }),
}));

import { reportsAPI } from '../../services/api';
import Dashboard from '../Dashboard';

const mockDashboard = (data: any) => {
  (reportsAPI.dashboard as ReturnType<typeof vi.fn>).mockResolvedValue({ data });
};

describe('Dashboard', () => {
  it('renderiza a saudação com o nome do usuário e os indicadores vindos de reportsAPI.dashboard', async () => {
    mockDashboard({
      total_students: 42,
      active_enrollments: 30,
      overdue_count: 3,
      due_soon_count: 5,
      monthly_income: 12000,
      birthdays: [{ id: 1, full_name: 'Ana Souza', birth_date: '2000-09-10' }],
      total_received: 8000,
      total_expected: 12000,
      recent_students: [{ id: 2, full_name: 'Bruno Lima', created_at: '2026-09-01', photo_url: null }],
    });
    render(<Dashboard />);

    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Maria');
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total de Alunos')).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
  });

  it('mostra os estados vazios de aniversariantes, alunos recentes e financeiro quando as listas vêm vazias', async () => {
    mockDashboard({
      total_students: 0,
      active_enrollments: 0,
      overdue_count: 0,
      due_soon_count: 0,
      monthly_income: 0,
      birthdays: [],
      total_received: 0,
      total_expected: 0,
      recent_students: [],
    });
    render(<Dashboard />);

    expect(await screen.findByText('Nenhum aniversariante este mês')).toBeInTheDocument();
    expect(screen.getByText('Nenhum aluno cadastrado')).toBeInTheDocument();
    expect(screen.getByText('Sem dados financeiros')).toBeInTheDocument();
  });
});
