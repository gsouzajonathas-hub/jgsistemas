import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    forgotPassword: vi.fn(() => Promise.resolve({ data: {} })),
    resetPassword: vi.fn(),
  },
}));

import { authAPI } from '../../services/api';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from '../Login';

const renderLogin = () => render(
  <MemoryRouter initialEntries={['/login']}>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>Pagina Inicial</div>} />
      </Routes>
    </AuthProvider>
  </MemoryRouter>
);

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renderiza o formulário de login com título, campos e botão Entrar', async () => {
    renderLogin();
    expect(await screen.findByRole('heading', { level: 2, name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('submete o login chamando authAPI.login com email e senha e navega ao sucesso', async () => {
    (authAPI.login as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { access_token: 'tok-123', user: { id: 1, name: 'Ana Souza', email: 'ana@teste.com', role: 'admin' } },
    });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'ana@teste.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({ email: 'ana@teste.com', password: 'senha123' });
    });
    expect(await screen.findByText('Pagina Inicial')).toBeInTheDocument();
  });

  it('mostra mensagem de erro retornada pela API quando o login falha', async () => {
    (authAPI.login as ReturnType<typeof vi.fn>).mockRejectedValue({ response: { data: { detail: 'Credenciais inválidas' } } });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'ana@teste.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'errada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Credenciais inválidas')).toBeInTheDocument();
  });

  it('fluxo esqueci minha senha chama authAPI.forgotPassword e mostra a mensagem de confirmação', async () => {
    renderLogin();
    fireEvent.click(await screen.findByRole('button', { name: 'Esqueci minha senha' }));
    expect(await screen.findByRole('heading', { name: 'Recuperar senha' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'ana@teste.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar instruções' }));

    await waitFor(() => expect(authAPI.forgotPassword).toHaveBeenCalledWith({ email: 'ana@teste.com' }));
    expect(await screen.findByText('Se o email existir, você receberá as instruções.')).toBeInTheDocument();
  });
});
