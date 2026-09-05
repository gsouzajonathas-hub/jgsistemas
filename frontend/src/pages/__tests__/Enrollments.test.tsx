import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  enrollmentsAPI: {
    list: vi.fn(),
    create: vi.fn(() => Promise.resolve({ data: { id: 10 } })),
    cancel: vi.fn(() => Promise.resolve({ data: {} })),
    suspend: vi.fn(() => Promise.resolve({ data: {} })),
    renew: vi.fn(() => Promise.resolve({ data: {} })),
  },
  studentsAPI: {
    list: vi.fn(() => Promise.resolve({ data: { students: [{ id: 1, full_name: 'Ana Souza' }] } })),
  },
  classesAPI: {
    list: vi.fn(() => Promise.resolve({ data: [{ id: 5, name: 'Turma A1', current_count: 3, max_capacity: 20 }] })),
  },
}));

import { enrollmentsAPI } from '../../services/api';
import Enrollments from '../Enrollments';

const mockList = (enrollments: any[], total = enrollments.length) => {
  (enrollmentsAPI.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { enrollments, total } });
};

describe('Enrollments', () => {
  it('renderiza o título Matrículas e a matrícula mockada vinda de enrollmentsAPI.list', async () => {
    mockList([{ id: 1, student_id: 1, student_name: 'Ana Souza', status: 'active', enrollment_date: '2026-01-10' }]);
    render(<Enrollments />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Matrículas' })).toBeInTheDocument();
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('1 matrícula(s)')).toBeInTheDocument();
    expect(screen.getAllByText('Ativa').length).toBeGreaterThan(0);
  });

  it('mostra estado vazio quando não há matrículas', async () => {
    mockList([]);
    render(<Enrollments />);
    expect(await screen.findByText('Nenhuma matrícula encontrada')).toBeInTheDocument();
  });

  it('cria uma matrícula chamando enrollmentsAPI.create com aluno e turma selecionados', async () => {
    mockList([]);
    render(<Enrollments />);
    fireEvent.click(await screen.findByRole('button', { name: /Nova Matrícula/i }));
    await screen.findByText('Ana Souza');
    await screen.findByText(/Turma A1/);
    const [studentSelect, classSelect] = screen.getAllByRole('combobox');
    fireEvent.change(studentSelect, { target: { value: '1' } });
    fireEvent.change(classSelect, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Matricular' }));
    await waitFor(() => {
      expect(enrollmentsAPI.create).toHaveBeenCalledWith(expect.objectContaining({ student_id: 1, class_group_id: 5 }));
    });
  });

  it('renova, tranca e cancela uma matrícula chamando as APIs correspondentes', async () => {
    mockList([{ id: 7, student_id: 2, student_name: 'Bruno Lima', status: 'active', enrollment_date: '2026-02-01' }]);
    render(<Enrollments />);
    await screen.findByText('Bruno Lima');

    fireEvent.click(screen.getByTitle('Renovar'));
    await waitFor(() => expect(enrollmentsAPI.renew).toHaveBeenCalledWith(7));

    fireEvent.click(screen.getByTitle('Trancar'));
    await waitFor(() => expect(enrollmentsAPI.suspend).toHaveBeenCalledWith(7));

    fireEvent.click(screen.getByTitle('Cancelar'));
    await waitFor(() => expect(enrollmentsAPI.cancel).toHaveBeenCalledWith(7));
  });

  it('filtra por status clicando nos botões de filtro', async () => {
    mockList([]);
    render(<Enrollments />);
    await screen.findByRole('heading', { level: 1, name: 'Matrículas' });
    fireEvent.click(screen.getByRole('button', { name: 'Ativa' }));
    await waitFor(() => {
      expect(enrollmentsAPI.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });
  });
});
