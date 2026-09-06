// T-04.02 (super-admin-master, D-04): Sidebar esconde Configurações sem o módulo 'settings'.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';

vi.mock('../../services/api', () => ({
  settingsAPI: { get: vi.fn(() => Promise.resolve({ data: {} })) },
}));

let mockHasPermission = (_permission: string) => true;
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Usuario Teste', role: 'secretary' },
    logout: vi.fn(),
    hasPermission: (p: string) => mockHasPermission(p),
  }),
}));

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <Sidebar collapsed={false} onToggleCollapse={() => {}} mobileOpen={false} onCloseMobile={() => {}} />
    </MemoryRouter>
  );

describe('Sidebar', () => {
  it('esconde o item Configurações quando hasPermission("settings") e falso', async () => {
    mockHasPermission = (p) => p !== 'settings';
    renderSidebar();
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('mostra o item Configurações quando hasPermission("settings") e verdadeiro', async () => {
    mockHasPermission = () => true;
    renderSidebar();
    expect(await screen.findByText('Configurações')).toBeInTheDocument();
  });
});
