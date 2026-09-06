// T-04.03 (super-admin-master, D-01): admin comum nao ve a aba Usuarios em Configuracoes.
// Arquivo separado porque o mock de useAuth precisa de um role diferente do usado em
// Settings.test.tsx (que usa super_admin para exercitar a aba de usuarios).
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  settingsAPI: {
    get: vi.fn(() => Promise.resolve({ data: { school_name: 'Escola Teste', payment_methods: 'PIX,Dinheiro' } })),
    update: vi.fn(),
    uploadLogo: vi.fn(),
  },
  authAPI: {
    getUsers: vi.fn(() => Promise.resolve({ data: [] })),
    deleteUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
  backupAPI: { export: vi.fn() },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin Comum', email: 'admin@teste.local', role: 'admin' } }),
}));

vi.mock('../../hooks/useSettings', () => ({
  pushSettingsCache: vi.fn(),
}));

import Settings from '../Settings';
import { authAPI } from '../../services/api';

describe('Settings — admin comum', () => {
  it('nao mostra a aba Usuarios e nao chama getUsers', async () => {
    render(<Settings />);
    await screen.findByDisplayValue('Escola Teste');

    expect(screen.queryByRole('button', { name: /Usuários/i })).not.toBeInTheDocument();
    expect(authAPI.getUsers).not.toHaveBeenCalled();
  });
});
