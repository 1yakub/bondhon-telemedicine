"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/api";
import type {
  AdminAnalytics,
  AdminConsultation,
  AdminDoctor,
  AdminPatient,
  AdminStats,
  Consultation,
  Doctor,
  DoctorStats,
  User,
  VideoSession,
} from "@/lib/types";

/* ---------- keys ---------- */

export const keys = {
  user: ["user"] as const,
  doctors: ["doctors"] as const,
  doctor: (id: number | string) => ["doctors", String(id)] as const,
  consultations: ["consultations"] as const,
  consultation: (id: number | string) => ["consultations", String(id)] as const,
  doctorStats: ["doctor", "stats"] as const,
  admin: (what: string) => ["admin", what] as const,
};

/* ---------- session ---------- */

export function useUser() {
  return useQuery({
    queryKey: keys.user,
    queryFn: async (): Promise<User | null> => {
      try {
        const { data } = await api.get<{ user: User }>("/auth/user");
        return data.user;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(keys.user, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "user" });
    },
  });
}

/* ---------- public ---------- */

export function useDoctors() {
  return useQuery({
    queryKey: keys.doctors,
    queryFn: async () => (await api.get<{ doctors: Doctor[] }>("/doctors")).data.doctors,
    refetchInterval: 30_000,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: keys.doctor(id),
    queryFn: async () => (await api.get<{ data: Doctor }>(`/doctors/${id}`)).data.data,
    refetchInterval: 30_000,
  });
}

/* ---------- consultations (patient and doctor) ---------- */

export function useConsultations() {
  return useQuery({
    queryKey: keys.consultations,
    queryFn: async () => (await api.get<{ data: Consultation[] }>("/consultations")).data.data,
    refetchInterval: 20_000,
  });
}

export function useConsultation(id: string) {
  return useQuery({
    queryKey: keys.consultation(id),
    queryFn: async () => (await api.get<{ data: Consultation }>(`/consultations/${id}`)).data.data,
    // a visit that is waiting for payment or for the doctor keeps itself current
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "completed" || s === "cancelled" ? false : 15_000;
    },
  });
}

export function useBookConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { doctor_id: number; patient_symptoms?: string }) =>
      (await api.post<{ data: Consultation }>("/consultations", input)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.consultations }),
  });
}

export function useCancelConsultation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/consultations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.consultations }),
  });
}

export function useStartPayment(id: string) {
  return useMutation({
    mutationFn: async () =>
      (await api.post<{ payment_url: string; transaction_id: string }>(`/consultations/${id}/pay`)).data,
  });
}

export const video = {
  token: (id: string) => api.post<VideoSession>(`/consultations/${id}/video/token`).then((r) => r.data),
  start: (id: string) => api.post(`/consultations/${id}/video/start`),
  end: (id: string) => api.post(`/consultations/${id}/video/end`),
};

/* ---------- patient account ---------- */

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => (await api.put<{ user: User }>("/profile", input)).data.user,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.user }),
  });
}

/* ---------- doctor ---------- */

export function useDoctorStats() {
  return useQuery({
    queryKey: keys.doctorStats,
    queryFn: async () => (await api.get<{ stats: DoctorStats }>("/doctor/stats")).data.stats,
    refetchInterval: 30_000,
  });
}

export function useToggleOnline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<{ is_online: boolean }>("/doctor/toggle-status")).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.user }),
  });
}

export function useUpdateDoctorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => (await api.put("/doctor/profile", input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.user }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { current_password: string; new_password: string; new_password_confirmation: string }) =>
      api.put("/doctor/change-password", input),
  });
}

/* ---------- admin ---------- */

export function useAdminStats() {
  return useQuery({
    queryKey: keys.admin("stats"),
    queryFn: async () => (await api.get<{ stats: AdminStats }>("/admin/stats")).data.stats,
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: keys.admin("analytics"),
    queryFn: async () => (await api.get<{ analytics: AdminAnalytics }>("/admin/analytics")).data.analytics,
  });
}

export function useAdminDoctors() {
  return useQuery({
    queryKey: keys.admin("doctors"),
    queryFn: async () => (await api.get<{ doctors: AdminDoctor[] }>("/admin/doctors")).data.doctors,
  });
}

export function useAdminPatients() {
  return useQuery({
    queryKey: keys.admin("patients"),
    queryFn: async () => (await api.get<{ patients: AdminPatient[] }>("/admin/patients")).data.patients,
  });
}

export function useAdminConsultations() {
  return useQuery({
    queryKey: keys.admin("consultations"),
    queryFn: async () => (await api.get<{ consultations: AdminConsultation[] }>("/admin/consultations")).data.consultations,
  });
}

export function useAdminDoctorMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: keys.admin("doctors") });
    qc.invalidateQueries({ queryKey: keys.admin("stats") });
    qc.invalidateQueries({ queryKey: keys.doctors });
  };
  const create = useMutation({
    mutationFn: (input: Record<string, unknown>) => api.post("/admin/doctors", input),
    onSuccess: refresh,
  });
  const toggle = useMutation({
    mutationFn: (id: number) => api.post(`/admin/doctors/${id}/toggle-status`),
    onSuccess: refresh,
  });
  const resetPassword = useMutation({
    mutationFn: ({ id, new_password }: { id: number; new_password: string }) =>
      api.put(`/admin/doctors/${id}/password`, { new_password }),
  });
  return { create, toggle, resetPassword };
}
