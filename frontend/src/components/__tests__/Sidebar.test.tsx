import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  settingsAPI: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
  },
  authAPI: {
    getUsers: vi.fn(),
    deleteUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Suporte JG', email: 'suporte@teste.local', role: 'super_admin' }, logout: vi.fn(), hasPermission: () => true }),
}));

import Sidebar from '../Sidebar';

describe('super_admin na Sidebar (T-04.05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o label "Super Admin" no rodapé', async () => {
    render(
      <MemoryRouter>
        <Sidebar collapsed={false} onToggleCollapse={() => {}} mobileOpen={false} onCloseMobile={() => {}} />
      </MemoryRouter>
    );
    expect(await screen.findByText('Suporte JG')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
  });
});