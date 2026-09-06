export type Role = "patient" | "doctor" | "admin";

export type DoctorProfile = {
  specialization: string | null;
  qualifications: string | null;
  experience_years: number | null;
  fee_per_consultation: string;
  is_online: boolean;
};

export type User = {
  id: number;
  role: Role;
  name: string | null;
  phone: string | null;
  email: string | null;
  gender: "male" | "female" | "other" | null;
  date_of_birth: string | null;
  address: string | null;
  profile_photo: string | null;
  profile_complete: boolean;
  doctor?: DoctorProfile | null;
};

export type Doctor = {
  id: number;
  name: string;
  gender: string | null;
  profile_photo: string | null;
  specialization: string | null;
  qualifications?: string | null;
  experience_years: number | null;
  fee_per_consultation: string;
  is_online: boolean;
};

export type ConsultationStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export type Consultation = {
  id: number;
  status: ConsultationStatus;
  payment_status: "pending" | "paid" | "failed";
  amount: string;
  patient_symptoms: string | null;
  doctor_notes?: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  created_at: string;
  doctor?: {
    id: number;
    name: string;
    gender: string | null;
    profile_photo: string | null;
    specialization: string | null;
    qualifications: string | null;
    is_online: boolean;
  };
  patient?: {
    id: number;
    name: string | null;
    gender: string | null;
    age: number | null;
    phone?: string;
  };
  payment?: { status: string; transaction_id: string; paid_at: string | null } | null;
};

export type VideoSession = {
  token: string;
  channel: string;
  uid: number;
  app_id: string;
  expires_at: string;
};

export type AdminStats = {
  total_doctors: number;
  total_patients: number;
  total_consultations: number;
  total_revenue: number | string;
  online_doctors: number;
  pending_consultations: number;
};

export type AdminAnalytics = {
  consultations_by_status: Record<string, number>;
  consultations_by_month: { month: string; count: number }[];
  revenue_by_month: { month: string; total: string }[];
  top_doctors: { doctor_name: string | null; consultation_count: number }[];
};

export type AdminDoctor = {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  qualifications: string | null;
  experience_years: number | null;
  fee_per_consultation: string;
  is_online: boolean;
  created_at: string;
};

export type AdminPatient = {
  id: number;
  name: string | null;
  phone: string;
  gender: string | null;
  age: number | null;
  profile_complete: boolean;
  registration_date: string;
  total_consultations: number;
  total_spent: number | string;
  status: "active" | "inactive";
};

export type AdminConsultation = {
  id: number;
  patient_name: string | null;
  patient_phone: string;
  doctor_name: string;
  doctor_specialization: string;
  status: ConsultationStatus;
  fee_amount: string;
  payment_status: string;
  transaction_id: string | null;
  created_at: string;
  duration_minutes: number | null;
};

export type DoctorStats = {
  total_consultations: number;
  pending_consultations: number;
  completed_consultations: number;
  total_earnings: number | string;
};
