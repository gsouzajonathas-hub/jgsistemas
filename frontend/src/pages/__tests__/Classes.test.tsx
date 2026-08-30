import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  classesAPI: {
    list: vi.fn(() => Promise.resolve({ data: [{ id: 1, name: 'Turma A1', course_id: 1, teacher_id: 1, room: 'Sala 2', weekdays: 'Segunda,Quarta', start_time: '08:00', end_time: '09:00', max_capacity: 20, current_count: 3, level: 'Básico', unit: 'Matriz', is_active: 1, teacher_name: 'Prof. Ana', course_name: 'Inglês' }] })),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  coursesAPI: { list: vi.fn(() => Promise.resolve({ data: [] })) },
  teachersAPI: { list: vi.fn(() => Promise.resolve({ data: [] })) },
}));

import Classes from '../Classes';

describe('Classes', () => {
  it('renderiza o título e a lista de turmas carregadas da API', async () => {
    render(<MemoryRouter><Classes /></MemoryRouter>);
    expect(await screen.findByRole('heading', { level: 1, name: 'Turmas' })).toBeInTheDocument();
    expect(await screen.findByText('Turma A1')).toBeInTheDocument();
    expect(screen.getByText('Inglês')).toBeInTheDocument();
  });
});