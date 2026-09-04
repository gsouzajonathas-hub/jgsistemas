import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  teachersAPI: {
    list: vi.fn(),
    listAll: vi.fn(),
    create: vi.fn(() => Promise.resolve({ data: { id: 2 } })),
    update: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import { teachersAPI } from '../../services/api';
import Teachers from '../Teachers';

const mockListAll = (data: any[]) => {
  (teachersAPI.listAll as any).mockResolvedValue({ data });
};

describe('Teachers', () => {
  it('renderiza o título h1 Professores e a lista mockada vinda da API via listAll', async () => {
    mockListAll([{ id: 1, full_name: 'Ana Souza', specialization: 'Inglês', email: 'ana@teste.com', phone: '(11) 99999-0000', hourly_rate: 50, is_active: true }]);
    render(<Teachers />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Professores' })).toBeInTheDocument();
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Inglês')).toBeInTheDocument();
    expect(teachersAPI.listAll).toHaveBeenCalled();
  });

  it('mostra estado vazio com CTA quando a lista é vazia', async () => {
    mockListAll([]);
    render(<Teachers />);
    expect(await screen.findByText('Nenhum professor cadastrado')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar primeiro professor/i }));
    expect(await screen.findByRole('heading', { name: 'Novo Professor' })).toBeInTheDocument();
  });

  it('cria um professor chamando teachersAPI.create com o payload do TeacherSchema', async () => {
    mockListAll([]);
    render(<Teachers />);
    fireEvent.click(await screen.findByRole('button', { name: /Novo Professor/i }));
    fireEvent.change(await screen.findByLabelText(/Nome Completo/i), { target: { value: 'Ana Souza' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      expect(teachersAPI.create).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Ana Souza' }));
    });
  });

  it('edita um professor chamando teachersAPI.update com o id e o payload', async () => {
    mockListAll([{ id: 1, full_name: 'Ana Souza', specialization: 'Inglês', hourly_rate: 50, is_active: true }]);
    render(<Teachers />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar professor' }));
    const nameInput = await screen.findByLabelText(/Nome Completo/i);
    expect((nameInput as HTMLInputElement).value).toBe('Ana Souza');
    fireEvent.change(nameInput, { target: { value: 'Ana Souza Lima' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      expect(teachersAPI.update).toHaveBeenCalledWith(1, expect.objectContaining({ full_name: 'Ana Souza Lima' }));
    });
  });

  it('exclui um professor chamando teachersAPI.delete após confirmação', async () => {
    mockListAll([{ id: 1, full_name: 'Ana Souza' }]);
    render(<Teachers />);
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir professor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sim' }));
    await waitFor(() => {
      expect(teachersAPI.delete).toHaveBeenCalledWith(1);
    });
  });
});