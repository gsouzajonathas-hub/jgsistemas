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

// super-admin-master (D-01): a aba Usuarios e exclusiva do super_admin — os testes desta
// pagina que exercitam essa aba precisam de um usuario logado com esse role.
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Suporte Teste', email: 'suporte@teste.local', role: 'super_admin' } }),
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

  it('formulario de novo usuario mostra checkbox de Auditoria e Configuracoes (T-02.02, D-04)', async () => {
    render(<Settings />);
    await abrirAbaUsuarios();

    fireEvent.click(screen.getByRole('button', { name: /Novo Usuário/i }));

    expect(await screen.findByText('Auditoria')).toBeInTheDocument();
    // "Configurações" também é o rótulo de outro elemento da página — o checkbox novo do
    // modal precisa ser uma ocorrência A MAIS, não a única.
    expect(screen.getAllByText('Configurações').length).toBeGreaterThanOrEqual(2);
  });

  it('checkboxes de modulo aparecem mesmo com Perfil=Administrador selecionado (T-04.03, D-02)', async () => {
    render(<Settings />);
    await abrirAbaUsuarios();

    fireEvent.click(screen.getByRole('button', { name: /Novo Usuário/i }));
    const selectPerfil = await screen.findByDisplayValue('Secretaria');
    fireEvent.change(selectPerfil, { target: { value: 'admin' } });

    expect(screen.getByText('Módulos com acesso')).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
  });
});