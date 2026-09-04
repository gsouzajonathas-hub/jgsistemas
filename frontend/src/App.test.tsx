import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('./services/api', () => {
  const g = () => vi.fn(() => Promise.resolve({ data: [] }));
  const go = () => vi.fn(() => Promise.resolve({ data: {} }));
  return {
    authAPI: { login: vi.fn(), register: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn(), changePassword: vi.fn(), getMe: vi.fn(), getUsers: g(), createUser: vi.fn(), updateUser: vi.fn(), deleteUser: vi.fn() },
    studentsAPI: { list: g(), get: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), uploadFile: vi.fn(), getFiles: vi.fn(), downloadFile: vi.fn(), deleteFile: vi.fn(), carnePDF: vi.fn() },
    auditAPI: { list: g() },
    coursesAPI: { list: g() },
    plansAPI: { list: g(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), toggle: vi.fn(), contract: vi.fn() },
    contractsAPI: { list: g(), pdf: vi.fn(), sign: vi.fn(), cancel: vi.fn() },
    enrollmentsAPI: { list: g(), create: vi.fn(), update: vi.fn(), cancel: vi.fn(), suspend: vi.fn(), renew: vi.fn() },
    financialAPI: { getPlans: g(), createPlan: vi.fn(), getInstallments: g(), createInstallment: vi.fn(), generateMonth: vi.fn(), registerPayment: vi.fn(), receipt: vi.fn(), dashboard: go(), createDiscount: vi.fn() },
    carnesAPI: { list: g(), get: vi.fn(), create: vi.fn(), cancel: vi.fn(), stats: go(), registerPayment: vi.fn(), studentInstallments: vi.fn(), carnePDF: vi.fn(), customPdf: vi.fn() },
    scheduleAPI: { list: g(), create: vi.fn(), delete: vi.fn() },
    reportsAPI: { dashboard: go(), activeStudents: g(), inactiveStudents: g(), overdue: g(), enrollments: g(), financial: g(), studentsExcel: vi.fn(), studentsPDF: vi.fn(), overdueExcel: vi.fn(), overduePDF: vi.fn() },
    searchAPI: { search: g() },
    materialsAPI: { list: g(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), listSales: g(), createSale: vi.fn(), dashboard: go() },
    settingsAPI: { get: go(), update: vi.fn(), uploadLogo: vi.fn() },
    studentProfileAPI: { get: vi.fn(), pdf: vi.fn() },
    teachersAPI: { list: g(), listAll: g() },
    classesAPI: { list: g(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    attendanceAPI: { list: g(), bulk: vi.fn() },
    evaluationsAPI: { list: g(), create: vi.fn(), bulk: vi.fn(), update: vi.fn(), delete: vi.fn(), average: vi.fn() },
    weightConfigAPI: { list: g(), save: vi.fn() },
    boletinsAPI: { students: g(), get: vi.fn(), turma: vi.fn(), pdf: vi.fn(), excel: vi.fn(), turmaPdf: vi.fn(), turmaExcel: vi.fn() },
    certificatesAPI: { list: g(), student: vi.fn(), issue: vi.fn(), pdf: vi.fn() },
    default: {},
  };
});

import App from './App';

const setUser = (user: Record<string, unknown>) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', 'token-teste');
};

const goTo = (path: string) => {
  window.history.pushState({}, '', path);
};

describe('roteamento das 5 rotas reativadas', () => {
  it('admin acessa /classes e vê o conteúdo de Classes sem redirect', async () => {
    setUser({ id: 1, name: 'Admin', email: 'admin@teste.com', role: 'admin', permissions: [] });
    goTo('/classes');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Turmas' })).toBeInTheDocument();
  });

  it('usuário sem a permissão classes é bloqueado e não vê o conteúdo', async () => {
    setUser({ id: 2, name: 'Secretaria', email: 'sec@teste.com', role: 'secretary', permissions: [] });
    goTo('/classes');
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 1, name: 'Turmas' })).not.toBeInTheDocument();
    });
  });
});

describe('rotas de Cursos e Professores (T-01.01)', () => {
  it('admin acessa /courses e vê a página de Cursos sem redirect', async () => {
    setUser({ id: 1, name: 'Admin', email: 'admin@teste.com', role: 'admin', permissions: [] });
    goTo('/courses');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Cursos' })).toBeInTheDocument();
  });

  it('admin acessa /teachers e vê a página de Professores sem redirect', async () => {
    setUser({ id: 1, name: 'Admin', email: 'admin@teste.com', role: 'admin', permissions: [] });
    goTo('/teachers');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Professores' })).toBeInTheDocument();
  });

  it('secretary sem a permissão teachers é bloqueada e não vê /teachers', async () => {
    setUser({ id: 2, name: 'Secretaria', email: 'sec@teste.com', role: 'secretary', permissions: [] });
    goTo('/teachers');
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 1, name: 'Professores' })).not.toBeInTheDocument();
    });
  });
});