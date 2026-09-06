import { StaffLogin } from "@/components/staff-login";

export const metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return <StaffLogin role="admin" />;
}
