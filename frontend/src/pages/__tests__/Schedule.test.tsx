import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  scheduleAPI: {
    list: vi.fn(),
    create: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import { scheduleAPI } from '../../services/api';
import Schedule from '../Schedule';

const mockEvents = (data: any[]) => {
  (scheduleAPI.list as any).mockResolvedValue({ data });
};

describe('Schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o título Agenda e os próximos eventos vindos da API', async () => {
    mockEvents([
      { id: 1, title: 'Prova Final', event_type: 'prova', date: '2026-01-15', start_time: '10:00' },
    ]);

    render(<Schedule />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Agenda' })).toBeInTheDocument();
    expect(await screen.findByText('Prova Final')).toBeInTheDocument();
    expect(screen.getByText('Próximos Eventos')).toBeInTheDocument();
    expect(scheduleAPI.list).toHaveBeenCalled();
  });

  it('não mostra a seção de próximos eventos quando a lista está vazia', async () => {
    mockEvents([]);
    render(<Schedule />);
    await waitFor(() => expect(scheduleAPI.list).toHaveBeenCalled());
    expect(screen.queryByText('Próximos Eventos')).not.toBeInTheDocument();
  });

  it('cria um novo evento chamando scheduleAPI.create com o payload do formulário', async () => {
    mockEvents([]);
    render(<Schedule />);
    await waitFor(() => expect(scheduleAPI.list).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));
    expect(await screen.findByRole('heading', { name: 'Novo Evento' })).toBeInTheDocument();

    const tituloLabel = screen.getByText('Título *');
    const tituloInput = tituloLabel.parentElement!.querySelector('input') as HTMLInputElement;
    fireEvent.change(tituloInput, { target: { value: 'Reunião de Pais' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Evento' }));

    await waitFor(() => {
      expect(scheduleAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Reunião de Pais', event_type: 'aula' })
      );
    });
  });

  it('exclui um evento chamando scheduleAPI.delete após confirmação', async () => {
    mockEvents([
      { id: 9, title: 'Aula de Reforço', event_type: 'aula', date: '2026-02-20', start_time: '' },
    ]);
    render(<Schedule />);

    const eventTitle = await screen.findByText('Aula de Reforço');
    const eventRow = eventTitle.closest('.flex.items-center.justify-between') as HTMLElement;
    fireEvent.click(eventRow.querySelector('button') as HTMLButtonElement);

    fireEvent.click(await screen.findByRole('button', { name: 'Sim, excluir' }));

    await waitFor(() => {
      expect(scheduleAPI.delete).toHaveBeenCalledWith(9);
    });
  });
});
