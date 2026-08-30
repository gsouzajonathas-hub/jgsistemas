import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  classesAPI: {
    list: vi.fn(() => Promise.resolve({ data: [{ id: 1, name: 'Turma A1', course_id: 1, teacher_id: 1, room: '', weekdays: 'Segunda,Quarta', start_time: '08:00', end_time: '09:00', max_capacity: 20, current_count: 3, level: 'Básico', unit: 'Matriz', is_active: 1 }] })),
  },
  studentsAPI: { list: vi.fn(() => Promise.resolve({ data: [] })) },
  attendanceAPI: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
    bulk: vi.fn(() => Promise.resolve({ data: { updated: 0, created: 0 } })),
  },
}));

import Attendance from '../Attendance';

describe('Attendance', () => {
  it('renderiza o título e o seletor de turma com as turmas da API', async () => {
    render(<MemoryRouter><Attendance /></MemoryRouter>);
    expect(await screen.findByRole('heading', { level: 1, name: 'Controle de Frequência' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Turma A1' })).toBeInTheDocument();
  });

  it('exibe o botão de salvar frequência desabilitado sem turma selecionada', async () => {
    render(<MemoryRouter><Attendance /></MemoryRouter>);
    await screen.findByRole('heading', { level: 1, name: 'Controle de Frequência' });
    const salvar = screen.getByRole('button', { name: /salvar/i });
    expect(salvar).toBeDisabled();
  });
});