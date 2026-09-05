import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  studentsAPI: {
    list: vi.fn(),
    create: vi.fn(() => Promise.resolve({ data: { id: 2 } })),
    update: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import { studentsAPI } from '../../services/api';
import Students from '../Students';

const mockList = (students: any[], total = students.length) => {
  (studentsAPI.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { students, total } });
};

const renderStudents = () => render(<MemoryRouter><Students /></MemoryRouter>);

describe('Students', () => {
  it('renderiza o título Alunos e a lista mockada vinda de studentsAPI.list', async () => {
    mockList([{ id: 1, full_name: 'Ana Souza', cpf: '111.111.111-11', phone: '11999990000', status: 'active', english_level: 'Intermediário' }]);
    renderStudents();
    expect(await screen.findByRole('heading', { level: 1, name: 'Alunos' })).toBeInTheDocument();
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('1 aluno(s) cadastrado(s)')).toBeInTheDocument();
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0);
  });

  it('mostra estado vazio quando a lista vem vazia', async () => {
    mockList([]);
    renderStudents();
    expect(await screen.findByText('Nenhum aluno encontrado')).toBeInTheDocument();
  });

  it('cria um aluno chamando studentsAPI.create com o nome preenchido', async () => {
    mockList([]);
    renderStudents();
    fireEvent.click(await screen.findByRole('button', { name: /Novo Aluno/i }));
    const label = await screen.findByText('Nome completo *');
    const input = label.parentElement!.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Novo Aluno Teste' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Aluno' }));
    await waitFor(() => {
      expect(studentsAPI.create).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Novo Aluno Teste' }));
    });
  });

  it('filtra a lista chamando studentsAPI.list com o termo buscado', async () => {
    mockList([]);
    renderStudents();
    await screen.findByRole('heading', { level: 1, name: 'Alunos' });
    fireEvent.change(screen.getByPlaceholderText('Buscar por nome, CPF, email...'), { target: { value: 'Ana' } });
    await waitFor(() => {
      expect(studentsAPI.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'Ana' }));
    });
  });

  it('exclui um aluno chamando studentsAPI.delete após confirmação no ConfirmDialog', async () => {
    mockList([{ id: 1, full_name: 'Ana Souza', status: 'active' }]);
    renderStudents();
    fireEvent.click(await screen.findByTitle('Excluir'));
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, excluir' }));
    await waitFor(() => {
      expect(studentsAPI.delete).toHaveBeenCalledWith(1);
    });
  });
});
