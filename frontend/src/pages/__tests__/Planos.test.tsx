import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  plansAPI: {
    list: vi.fn(),
    create: vi.fn(() => Promise.resolve({ data: { id: 2 } })),
    update: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    toggle: vi.fn(() => Promise.resolve({ data: {} })),
    contract: vi.fn(),
  },
  coursesAPI: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
  },
  studentsAPI: {
    list: vi.fn(() => Promise.resolve({ data: { students: [] } })),
  },
  contractsAPI: {
    pdf: vi.fn(),
  },
}));

import { plansAPI, coursesAPI } from '../../services/api';
import Planos from '../Planos';

const mockPlans = (data: any[]) => {
  (plansAPI.list as any).mockResolvedValue({ data });
};

describe('Planos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (coursesAPI.list as any).mockResolvedValue({ data: [] });
  });

  it('renderiza o título e a lista de planos vinda da API', async () => {
    mockPlans([{
      id: 1, name: 'Plano Anual', value: 300, description: '', installments: 12, is_active: 1,
      course_id: null, course_name: 'Inglês', duration_months: 12, monthly_value: 300,
      gross_total: 3600, discount_type: 'percent', discount_value: 10, discount_amount: 360,
      final_value: 3240, upfront_discount_pct: 0, upfront_value: 3240, default_installments: 12,
    }]);

    render(<Planos />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Planos' })).toBeInTheDocument();
    expect(await screen.findByText('Plano Anual')).toBeInTheDocument();
    expect(screen.getByText('12 meses')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(plansAPI.list).toHaveBeenCalled();
  });

  it('mostra estado vazio quando não há planos cadastrados', async () => {
    mockPlans([]);
    render(<Planos />);
    expect(await screen.findByText('Nenhum plano cadastrado')).toBeInTheDocument();
  });

  it('cria um novo plano chamando plansAPI.create com o payload calculado', async () => {
    mockPlans([]);
    render(<Planos />);

    fireEvent.click(await screen.findByRole('button', { name: /Novo Plano/i }));
    expect(await screen.findByRole('heading', { name: 'Novo Plano' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Ex: Quadrimestral'), { target: { value: 'Plano Teste' } });
    fireEvent.change(screen.getByPlaceholderText('4'), { target: { value: '4' } });
    fireEvent.change(screen.getByPlaceholderText('300.00'), { target: { value: '300' } });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Plano' }));

    await waitFor(() => {
      expect(plansAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Plano Teste',
          value: 300,
          duration_months: 4,
          installments: 4,
          discount_type: 'percent',
          discount_value: 0,
          upfront_discount_pct: 0,
          course_id: null,
        })
      );
    });
  });

  it('edita um plano existente chamando plansAPI.update com o id correto', async () => {
    mockPlans([{
      id: 5, name: 'Plano Semestral', value: 200, description: '', installments: 6, is_active: 1,
      course_id: null, course_name: '', duration_months: 6, monthly_value: 200,
      gross_total: 1200, discount_type: 'percent', discount_value: 0, discount_amount: 0,
      final_value: 1200, upfront_discount_pct: 0, upfront_value: 1200, default_installments: 6,
    }]);
    render(<Planos />);

    fireEvent.click(await screen.findByTitle('Editar'));
    expect(await screen.findByRole('heading', { name: 'Editar Plano' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Ex: Quadrimestral'), { target: { value: 'Plano Semestral Editado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => {
      expect(plansAPI.update).toHaveBeenCalledWith(5, expect.objectContaining({ name: 'Plano Semestral Editado' }));
    });
  });

  it('exclui um plano chamando plansAPI.delete após confirmação', async () => {
    mockPlans([{
      id: 3, name: 'Plano X', value: 100, description: '', installments: 1, is_active: 1,
      course_id: null, course_name: '', duration_months: 1, monthly_value: 100,
      gross_total: 100, discount_type: 'percent', discount_value: 0, discount_amount: 0,
      final_value: 100, upfront_discount_pct: 0, upfront_value: 100, default_installments: 1,
    }]);
    render(<Planos />);

    fireEvent.click(await screen.findByTitle('Excluir'));
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, excluir' }));

    await waitFor(() => {
      expect(plansAPI.delete).toHaveBeenCalledWith(3);
    });
  });
});
