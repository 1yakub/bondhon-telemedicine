import { StaffLogin } from "@/components/staff-login";

export const metadata = { title: "Doctor sign in" };

export default function DoctorLoginPage() {
  return <StaffLogin role="doctor" />;
}
