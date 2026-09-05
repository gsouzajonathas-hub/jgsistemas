import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  it('nao renderiza nada quando open=false', () => {
    const { container } = render(
      <ConfirmDialog open={false} title="Excluir" message="Confirma?" onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza titulo, mensagem e botoes quando aberto', () => {
    render(
      <ConfirmDialog
        open
        title="Excluir usuário"
        message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Excluir usuário')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja excluir este usuário/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sim, excluir/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });

  it('botao de confirmacao usa vermelho por padrao', () => {
    render(
      <ConfirmDialog open title="Excluir" message="Confirma?" onConfirm={() => {}} onCancel={() => {}} />
    );
    const btn = screen.getByRole('button', { name: /Sim, excluir/i });
    expect(btn.className).toContain('bg-red-600');
  });

  it('botao de confirmacao usa amarelo quando color=amber', () => {
    render(
      <ConfirmDialog
        open
        color="amber"
        confirmLabel="Sim, desativar"
        title="Desativar"
        message="Confirma?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    const btn = screen.getByRole('button', { name: /Sim, desativar/i });
    expect(btn.className).toContain('bg-amber-500');
  });

  it('chama onConfirm ao clicar em confirmar', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="Excluir" message="Confirma?" onConfirm={onConfirm} onCancel={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Sim, excluir/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('chama onCancel ao clicar em cancelar', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="Excluir" message="Confirma?" onConfirm={() => {}} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('chama onCancel ao clicar no overlay', () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog open title="Excluir" message="Confirma?" onConfirm={() => {}} onCancel={onCancel} />
    );
    const overlay = container.querySelector('.absolute.inset-0');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay as Element);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});