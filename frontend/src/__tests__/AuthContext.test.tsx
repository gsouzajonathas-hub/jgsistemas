import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

vi.mock('../services/api', () => ({
  authAPI: { login: vi.fn() },
}));

function Consumidor({ children }: { children: (auth: ReturnType<typeof useAuth>) => React.ReactNode }) {
  const auth = useAuth();
  return <>{children(auth)}</>;
}

describe('super_admin no AuthContext (T-04.05)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('hasPermission retorna true para qualquer permissão quando role é super_admin', () => {
    localStorage.setItem('token', 'token-teste');
    localStorage.setItem('user', JSON.stringify({
      id: 1, name: 'Suporte', email: 'suporte@teste.local', role: 'super_admin',
    }));
    let resultado = false;
    render(
      <AuthProvider>
        <Consumidor>{(auth) => {
          resultado = auth.hasPermission('audit');
          return <div>ok</div>;
        }}</Consumidor>
      </AuthProvider>
    );
    expect(resultado).toBe(true);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('hasPermission retorna false sem usuário logado', () => {
    let resultado = true;
    render(
      <AuthProvider>
        <Consumidor>{(auth) => {
          resultado = auth.hasPermission('audit');
          return <div>vazio</div>;
        }}</Consumidor>
      </AuthProvider>
    );
    expect(resultado).toBe(false);
  });
});