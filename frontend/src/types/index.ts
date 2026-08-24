export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions?: string[] | null;
  avatar_url?: string;
  school_id?: number | null;
}

export interface Student {
  id: number;
  full_name: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  gender?: string;
  marital_status?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  zip_code?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  english_level?: string;
  enrollment_date?: string;
  status: string;
  notes?: string;
  unit?: string;
  photo_url?: string;
  monthly_fee?: number | null;
  due_day?: number | null;
  created_at?: string;
  responsible?: Responsible | null;
}

export interface Responsible {
  id?: number;
  full_name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  relationship?: string;
}

export interface Enrollment {
  id: number;
  student_id: number;
  class_group_id: number;
  student_name?: string;
  enrollment_date?: string;
  status: string;
  notes?: string;
}

export interface Installment {
  id: number;
  student_id: number;
  student_name?: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: string;
  payment_method?: string;
  notes?: string;
  payment_id?: number;
  receipt_number?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  event_type: string;
  date: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  color?: string;
}

export interface Dashboard {
  total_students: number;
  active_enrollments: number;
  inactive_students: number;
  overdue_count: number;
  due_soon_count: number;
  birthdays: { id: number; full_name: string; birth_date: string }[];
  recent_students: { id: number; full_name: string; photo_url?: string; created_at?: string }[];
  monthly_income: number;
  total_expected: number;
  total_received: number;
}

export interface SearchResult {
  type: string;
  id: number;
  title: string;
  subtitle: string;
  url: string;
}

export interface TeachingMaterial {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  is_active: number;
  created_at?: string;
}

export interface MaterialSale {
  id: number;
  material_id: number;
  student_id: number;
  material_name: string;
  student_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_method: string;
  notes: string;
  created_at?: string;
}

export interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  entity?: string;
  entity_id?: number | null;
  details?: string | null;
  ip_address?: string | null;
  created_at?: string;
}

export interface CoursePlan {
  id: number;
  name: string;
  value: number;
  description?: string;
  installments: number;
  is_active: number;
  course_id?: number | null;
  course_name?: string;
  duration_months: number;
  monthly_value: number;
  gross_total: number;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  discount_amount: number;
  final_value: number;
  upfront_discount_pct: number;
  upfront_value: number;
  default_installments: number;
}

export interface PlanCalc {
  gross_total: number;
  discount_amount: number;
  final_value: number;
  upfront_value: number;
  default_installments: number;
}

export interface ContractResult {
  message: string;
  contract_id?: number;
  gross_total: number;
  discount_amount: number;
  contract_value: number;
  upfront_discount_amount: number;
  total_due: number;
  installment_count: number;
  start_date: string;
  end_date: string;
  installments_created: { number: number; due_date: string; amount: number }[];
}

export interface FinancialContract {
  id: number;
  student_id: number;
  student_name: string;
  plan_name: string;
  course_name: string;
  start_date: string;
  end_date: string;
  mode: 'installments' | 'upfront';
  installments_count: number;
  final_value: number;
  total_due: number;
  status: 'pending' | 'signed' | 'cancelled';
  signed_at: string | null;
  created_at: string | null;
}
