import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  coursesAPI: {
    list: vi.fn(),
    create: vi.fn(() => Promise.resolve({ data: { id: 2 } })),
    update: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import { coursesAPI } from '../../services/api';
import Courses from '../Courses';

const mockList = (data: any[]) => {
  (coursesAPI.list as any).mockResolvedValue({ data });
};

describe('Courses', () => {
  it('renderiza o título h1 Cursos e a lista mockada vinda da API', async () => {
    mockList([{ id: 1, name: 'Inglês', level: 'Básico', description: 'Curso de inglês', duration_hours: 60, price: 299.9 }]);
    render(<Courses />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Cursos' })).toBeInTheDocument();
    expect(await screen.findByText('Inglês')).toBeInTheDocument();
    expect(screen.getByText('Básico')).toBeInTheDocument();
    expect(coursesAPI.list).toHaveBeenCalled();
  });

  it('mostra estado vazio com CTA quando a lista é vazia', async () => {
    mockList([]);
    render(<Courses />);
    expect(await screen.findByText('Nenhum curso cadastrado')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar primeiro curso/i }));
    expect(await screen.findByRole('heading', { name: 'Novo Curso' })).toBeInTheDocument();
  });

  it('cria um curso chamando coursesAPI.create com o payload do CourseSchema', async () => {
    mockList([]);
    render(<Courses />);
    fireEvent.click(await screen.findByRole('button', { name: /Novo Curso/i }));
    fireEvent.change(await screen.findByLabelText(/Nome do Curso/i), { target: { value: 'Inglês' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      expect(coursesAPI.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Inglês' }));
    });
  });

  it('edita um curso chamando coursesAPI.update com o id e o payload', async () => {
    mockList([{ id: 1, name: 'Inglês', level: 'Básico', duration_hours: 60, price: 299.9 }]);
    render(<Courses />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar curso' }));
    const nameInput = await screen.findByLabelText(/Nome do Curso/i);
    expect((nameInput as HTMLInputElement).value).toBe('Inglês');
    fireEvent.change(nameInput, { target: { value: 'Inglês Avançado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      expect(coursesAPI.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Inglês Avançado' }));
    });
  });

  it('exclui um curso chamando coursesAPI.delete após confirmação', async () => {
    mockList([{ id: 1, name: 'Inglês' }]);
    render(<Courses />);
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir curso' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sim' }));
    await waitFor(() => {
      expect(coursesAPI.delete).toHaveBeenCalledWith(1);
    });
  });
});