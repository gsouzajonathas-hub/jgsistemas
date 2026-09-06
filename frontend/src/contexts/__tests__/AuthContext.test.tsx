// T-04.01 (super-admin-master, D-02): hasPermission com bypass exclusivo do super_admin.
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

function Sonda({ permission }: { permission: string }) {
  const { hasPermission, loading } = useAuth();
  if (loading) return null;
  return <span>{hasPermission(permission) ? 'permitido' : 'negado'}</span>;
}

const renderComUsuario = (user: any, permission: string) => {
  localStorage.setItem('token', 'token-fake');
  localStorage.setItem('user', JSON.stringify(user));
  return render(
    <AuthProvider>
      <Sonda permission={permission} />
    </AuthProvider>
  );
};

describe('AuthContext.hasPermission', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('admin comum sem o modulo em permissions e negado (D-02: nao ha mais bypass automatico)', async () => {
    renderComUsuario({ id: 1, role: 'admin', permissions: [] }, 'financial');
    expect(await screen.findByText('negado')).toBeInTheDocument();
  });

  it('admin comum com o modulo em permissions e permitido', async () => {
    renderComUsuario({ id: 1, role: 'admin', permissions: ['financial'] }, 'financial');
    expect(await screen.findByText('permitido')).toBeInTheDocument();
  });

  it('super_admin sem nenhuma permission setada e sempre permitido (bypass exclusivo)', async () => {
    renderComUsuario({ id: 1, role: 'super_admin', permissions: [] }, 'financial');
    expect(await screen.findByText('permitido')).toBeInTheDocument();
  });

  it('secretary sem o modulo continua negado (comportamento inalterado)', async () => {
    renderComUsuario({ id: 1, role: 'secretary', permissions: ['students'] }, 'financial');
    await waitFor(() => expect(screen.getByText('negado')).toBeInTheDocument());
  });
});
