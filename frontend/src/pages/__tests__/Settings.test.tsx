import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  settingsAPI: {
    get: vi.fn(() => Promise.resolve({ data: { school_name: 'Escola Teste', payment_methods: 'PIX,Dinheiro' } })),
    update: vi.fn(),
    uploadLogo: vi.fn(),
  },
  authAPI: {
    getUsers: vi.fn(() => Promise.resolve({ data: [
      { id: 1, name: 'Admin Teste', email: 'admin@teste.local', role: 'admin', is_active: true },
      { id: 2, name: 'Secretaria Ana', email: 'ana@teste.local', role: 'secretary', is_active: true },
    ] })),
    deleteUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
  backupAPI: { export: vi.fn() },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin Teste', email: 'admin@teste.local', role: 'admin' } }),
}));

vi.mock('../../hooks/useSettings', () => ({
  pushSettingsCache: vi.fn(),
}));

import Settings from '../Settings';
import { authAPI, settingsAPI } from '../../services/api';

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const abrirAbaUsuarios = async () => {
    const usersTab = await screen.findByRole('button', { name: /Usuários/i });
    fireEvent.click(usersTab);
    await screen.findByText('Secretaria Ana');
  };

  it('abre o ConfirmDialog ao clicar em Excluir em um usuário', async () => {
    render(<Settings />);
    await abrirAbaUsuarios();

    const excluirBtns = screen.getAllByRole('button', { name: /Excluir/i });
    fireEvent.click(excluirBtns[0]);

    expect(await screen.findByText('Excluir usuário')).toBeInTheDocument();
    expect(authAPI.deleteUser).not.toHaveBeenCalled();
  });

  it('cancelar fecha o dialogo sem excluir', async () => {
    render(<Settings />);
    await abrirAbaUsuarios();

    const excluirBtns = screen.getAllByRole('button', { name: /Excluir/i });
    fireEvent.click(excluirBtns[0]);
    fireEvent.click(await screen.findByRole('button', { name: /Cancelar/i }));

    await waitFor(() => expect(screen.queryByText('Excluir usuário')).not.toBeInTheDocument());
    expect(authAPI.deleteUser).not.toHaveBeenCalled();
  });

  it('confirmar chama deleteUser e remove o usuario da lista', async () => {
    (authAPI.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { message: 'Usuário excluído com sucesso' } });
    render(<Settings />);
    await abrirAbaUsuarios();

    const excluirBtns = screen.getAllByRole('button', { name: /Excluir/i });
    fireEvent.click(excluirBtns[0]);
    fireEvent.click(await screen.findByRole('button', { name: /Sim, excluir/i }));

    await waitFor(() => expect(authAPI.deleteUser).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByText('Secretaria Ana')).not.toBeInTheDocument());
  });

  it('deleteUser falhando dispara alerta de erro', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (authAPI.deleteUser as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: { detail: 'Não é possível excluir o último administrador ativo' } },
    });
    render(<Settings />);
    await abrirAbaUsuarios();

    const excluirBtns = screen.getAllByRole('button', { name: /Excluir/i });
    fireEvent.click(excluirBtns[0]);
    fireEvent.click(await screen.findByRole('button', { name: /Sim, excluir/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Não é possível excluir o último administrador ativo'));
    alertSpy.mockRestore();
  });

  it('mantém a chave PIX digitada e mostra erro quando o PUT falha (D-12)', async () => {
    (settingsAPI.update as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: { detail: 'Erro ao salvar. Tente novamente.' } },
    });
    render(<Settings />);
    await screen.findByDisplayValue('Escola Teste');

    const pixInput = screen.getByPlaceholderText(/CPF\/CNPJ, e-mail, telefone ou chave aleatória/i);
    fireEvent.change(pixInput, { target: { value: 'pix@teste.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));

    // D-12: o campo preserva o valor digitado e a mensagem aparece na tela
    expect(await screen.findByDisplayValue('pix@teste.com')).toBeInTheDocument();
    expect(await screen.findByText(/Erro ao salvar\. Tente novamente\./i)).toBeInTheDocument();
  });
});