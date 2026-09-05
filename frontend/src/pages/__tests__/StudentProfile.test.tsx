import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  studentProfileAPI: {
    get: vi.fn(),
    pdf: vi.fn(),
  },
  studentsAPI: {
    downloadFile: vi.fn(),
  },
  financialAPI: {
    registerPayment: vi.fn(),
    receipt: vi.fn(),
  },
  carnesAPI: {
    customPdf: vi.fn(),
  },
}));

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ settings: null, paymentMethods: ['PIX', 'Dinheiro'], refresh: vi.fn() }),
}));

import { studentProfileAPI, financialAPI } from '../../services/api';
import StudentProfile from '../StudentProfile';

const baseData = {
  student: {
    id: 1, full_name: 'Ana Souza', cpf: '111.111.111-11', phone: '11999990000',
    email: 'ana@teste.com', status: 'active', english_level: 'Intermediário',
  },
  responsible: { full_name: '' },
  enrollments: [],
  installments: [],
  files: [],
};

const renderProfile = (id = '1') => render(
  <MemoryRouter initialEntries={[`/students/${id}`]}>
    <Routes>
      <Route path="/students/:id" element={<StudentProfile />} />
    </Routes>
  </MemoryRouter>
);

describe('StudentProfile', () => {
  it('busca o perfil pelo id da rota e exibe o nome do aluno vindo de studentProfileAPI.get', async () => {
    (studentProfileAPI.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: baseData });
    renderProfile('1');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ana Souza' })).toBeInTheDocument();
    expect(screen.getByText('CPF: 111.111.111-11')).toBeInTheDocument();
    expect(studentProfileAPI.get).toHaveBeenCalledWith(1);
  });

  it('mostra o estado de não encontrado quando a API retorna erro (D-15: 404 real)', async () => {
    (studentProfileAPI.get as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { status: 404, data: { detail: 'Aluno não encontrado' } },
    });
    renderProfile('999999');
    expect(await screen.findByText('Aluno não encontrado')).toBeInTheDocument();
  });

  it('registra o pagamento de uma parcela pendente chamando financialAPI.registerPayment', async () => {
    const data = {
      ...baseData,
      installments: [{
        id: 5, installment_number: 1, description: 'Mensalidade 01', amount: 250, discount: 0,
        due_date: '2026-09-10', status: 'pending', payment_id: null,
      }],
    };
    (studentProfileAPI.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data });
    (financialAPI.registerPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    renderProfile('1');

    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });
    fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Receber' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar Recebimento' }));

    await waitFor(() => {
      expect(financialAPI.registerPayment).toHaveBeenCalledWith(expect.objectContaining({ installment_id: 5, payment_method: 'PIX' }));
    });
  });
});
