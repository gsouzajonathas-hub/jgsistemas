import axios from 'axios';
import type { User, Student, Enrollment, Installment, CalendarEvent, TeachingMaterial, MaterialSale, SearchResult, CoursePlan } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string; role?: string; permissions?: string[] }) => api.post('/auth/register', data),
  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
  resetPassword: (data: { email: string; token: string; new_password: string }) => api.post('/auth/reset-password', data),
  changePassword: (data: { current_password: string; new_password: string }) => api.post('/auth/change-password', data),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data: { name: string; email: string; password: string; role?: string; permissions?: string[] }) => api.post('/auth/register', data),
  updateUser: (id: number, data: { name?: string; email?: string; role?: string; permissions?: string[]; is_active?: boolean }) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/auth/users/${id}`),
};

export const studentsAPI = {
  list: (params?: { search?: string; status?: string; skip?: number; limit?: number }) => api.get('/students', { params }),
  get: (id: number) => api.get(`/students/${id}`),
  create: (data: Partial<Student>) => api.post('/students', data),
  update: (id: number, data: Partial<Student>) => api.put(`/students/${id}`, data),
  delete: (id: number) => api.delete(`/students/${id}`),
  uploadFile: (id: number, file: File, category: string) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/students/${id}/upload?category=${category}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getFiles: (id: number) => api.get(`/students/${id}/files`),
  downloadFile: (studentId: number, fileId: number) => api.get(`/students/${studentId}/files/${fileId}/download`, { responseType: 'blob' }),
  deleteFile: (studentId: number, fileId: number) => api.delete(`/students/${studentId}/files/${fileId}`),
  carnePDF: (id: number) => api.get(`/students/${id}/carne-pdf`, { responseType: 'blob' }),
};

export const auditAPI = {
  list: (params?: { skip?: number; limit?: number }) => api.get('/audit', { params }),
};

export const coursesAPI = {
  list: (params?: { skip?: number; limit?: number }) => api.get('/courses', { params }),
};

export const plansAPI = {
  list: () => api.get<CoursePlan[]>('/financial/plans'),
  create: (data: { name: string; value: number; description?: string; installments?: number; course_id?: number | null; duration_months: number; discount_type: 'percent' | 'fixed'; discount_value: number; upfront_discount_pct: number }) =>
    api.post('/financial/plans', data),
  update: (id: number, data: { name: string; value: number; description?: string; installments?: number; course_id?: number | null; duration_months: number; discount_type: 'percent' | 'fixed'; discount_value: number; upfront_discount_pct: number }) =>
    api.put(`/financial/plans/${id}`, data),
  delete: (id: number) => api.delete(`/financial/plans/${id}`),
  toggle: (id: number) => api.post(`/financial/plans/${id}/toggle`),
  contract: (id: number, data: { student_id: number; start_date: string; first_due_date: string; mode: 'installments' | 'upfront'; installments_count?: number | null; guardian_name?: string; guardian_cpf?: string; guardian_phone?: string; guardian_email?: string }) =>
    api.post(`/financial/plans/${id}/contract`, data),
};

export const contractsAPI = {
  list: (status?: string) => api.get('/financial/contracts', { params: status ? { status } : {} }),
  pdf: (id: number) => api.get(`/financial/contracts/${id}/pdf`, { responseType: 'blob' }),
  sign: (id: number) => api.post(`/financial/contracts/${id}/sign`),
  cancel: (id: number) => api.post(`/financial/contracts/${id}/cancel`),
};

export const enrollmentsAPI = {
  list: (params?: { skip?: number; limit?: number; status?: string; class_group_id?: number; student_id?: number }) => api.get('/enrollments', { params }),
  create: (data: { student_id: number; class_group_id: number; enrollment_date?: string; notes?: string }) => api.post('/enrollments', data),
  update: (id: number, data: { student_id: number; class_group_id: number; enrollment_date?: string; notes?: string }) => api.put(`/enrollments/${id}`, data),
  cancel: (id: number) => api.post(`/enrollments/${id}/cancel`),
  suspend: (id: number) => api.post(`/enrollments/${id}/suspend`),
  renew: (id: number) => api.post(`/enrollments/${id}/renew`),
};

export const financialAPI = {
  getPlans: () => api.get('/financial/plans'),
  createPlan: (data: { name: string; value: number; description?: string; installments?: number }) => api.post('/financial/plans', data),
  getInstallments: (params?: { student_id?: number; status?: string; month?: string; skip?: number; limit?: number }) => api.get('/financial/installments', { params }),
  createInstallment: (data: { student_id: number; plan_id?: number; description: string; amount: number; due_date: string; payment_method?: string; notes?: string }) => api.post('/financial/installments', data),
  generateMonth: (data: { month: string }) => api.post('/financial/generate-month', data),
  registerPayment: (data: { installment_id: number; amount: number; payment_date: string; payment_method: string; notes?: string }) => api.post('/financial/payments', data),
  receipt: (paymentId: number) => api.get(`/financial/payments/${paymentId}/receipt`, { responseType: 'blob' }),
  dashboard: (params?: { month?: string }) => api.get('/financial/dashboard', { params }),
  createDiscount: (data: { student_id: number; name: string; percentage?: number; amount?: number; reason?: string; valid_until?: string }) => api.post('/financial/discounts', data),
};

export const carnesAPI = {
  list: (params?: { search?: string; status?: string; month?: string; student_id?: number; course_id?: number; skip?: number; limit?: number }) => api.get('/carnes', { params }),
  get: (id: number) => api.get(`/carnes/${id}`),
  create: (data: { student_id: number; enrollment_id?: number; charge_type?: string; description?: string; total_installments?: number; installment_value: number; discount?: number; late_fee_pct?: number; interest_daily_pct?: number; first_due_date: string; interval?: string; payment_methods?: string }) => api.post('/carnes', data),
  cancel: (id: number) => api.post(`/carnes/${id}/cancel`),
  stats: (params?: { month?: string }) => api.get('/carnes/stats', { params }),
  registerPayment: (carnetId: number, installmentId: number, data: { amount: number; payment_date: string; payment_method: string; notes?: string }) =>
    api.post(`/carnes/${carnetId}/payments/${installmentId}`, data),
  studentInstallments: (studentId: number) => api.get(`/carnes/student/${studentId}/installments`),
  carnePDF: (id: number) => api.get(`/carnes/${id}/pdf`, { responseType: 'blob' }),
  customPdf: (data: { student_id: number; installment_ids: number[]; segunda_via?: boolean }) =>
    api.post('/carnes/custom-pdf', data, { responseType: 'blob' }),
};

export const scheduleAPI = {
  list: (params?: { month?: number; year?: number }) => api.get('/schedule', { params }),
  create: (data: { title: string; event_type: string; date: string; start_time?: string; end_time?: string; description?: string; color?: string }) => api.post('/schedule', data),
  delete: (id: number) => api.delete(`/schedule/${id}`),
};

export const reportsAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  activeStudents: () => api.get('/reports/active-students'),
  inactiveStudents: () => api.get('/reports/inactive-students'),
  overdue: () => api.get('/reports/overdue'),
  enrollments: () => api.get('/reports/enrollments'),
  financial: () => api.get('/reports/financial'),
  studentsExcel: () => api.get('/reports/students-excel', { responseType: 'blob' }),
  studentsPDF: () => api.get('/reports/students-pdf', { responseType: 'blob' }),
  overdueExcel: () => api.get('/reports/overdue-excel', { responseType: 'blob' }),
  overduePDF: () => api.get('/reports/overdue-pdf', { responseType: 'blob' }),
};

export const searchAPI = {
  search: (q: string) => api.get('/search', { params: { q } }),
};

export const materialsAPI = {
  list: (params?: { search?: string; category?: string }) => api.get('/materials', { params }),
  create: (data: { name: string; description?: string; price?: number; stock?: number; category?: string }) => api.post('/materials', data),
  update: (id: number, data: { name: string; description?: string; price?: number; stock?: number; category?: string }) => api.put(`/materials/${id}`, data),
  delete: (id: number) => api.delete(`/materials/${id}`),
  listSales: (params?: { student_id?: number; material_id?: number; skip?: number; limit?: number }) => api.get('/materials/sales', { params }),
  createSale: (data: { material_id: number; student_id: number; quantity?: number; unit_price?: number; payment_method?: string; notes?: string }) => api.post('/materials/sales', data),
  dashboard: () => api.get('/materials/dashboard'),
};

export interface SchoolSettings {
  id?: number;
  school_name?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  pix_key?: string;
  slogan?: string;
  social_media?: string;
  payment_methods?: string;
  primary_color?: string;
  dark_mode?: number;
  due_day?: number;
}

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: Partial<SchoolSettings>) => api.put('/settings', data),
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const studentProfileAPI = {
  get: (id: number) => api.get(`/student-profile/${id}`),
  pdf: (id: number) => api.get(`/student-profile/${id}/pdf`, { responseType: 'blob' }),
};

export default api;
