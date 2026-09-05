import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  auditAPI: {
    list: vi.fn(() => Promise.resolve({ data: {
      total: 2,
      logs: [
        { id: 1, user_name: 'Suporte JG', actor_role: 'super_admin', action: 'user.update', entity: 'user', entity_id: 3, details: 'email=suporte@teste.local', created_at: '2026-09-05T12:00:00' },
        { id: 2, user_name: 'Admin Teste', actor_role: 'admin', action: 'user.create', entity: 'user', entity_id: 5, details: 'email=ana@teste.local', created_at: '2026-09-04T12:00:00' },
      ],
    } })),
  },
}));

import Audit from '../Audit';

describe('Auditoria — badge de super admin (T-04.06)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe badge "Super Admin" apenas para logs com actor_role super_admin', async () => {
    render(<Audit />);
    await screen.findByText('Suporte JG');

    const badges = screen.getAllByText('Super Admin');
    expect(badges).toHaveLength(1);

    const adminRow = badges[0].closest('tr');
    expect(adminRow).not.toBeNull();
    await waitFor(() => {
      expect(screen.queryByText('Admin Teste')).toBeInTheDocument();
    });
    const adminRows = screen.getAllByText('Admin Teste');
    const adminRowNode = adminRows[0].closest('tr');
    expect(adminRowNode?.textContent).not.toContain('Super Admin');
  });
});