"use client";

import { use } from "react";
import { RequireRole } from "@/components/require-role";
import { CallPage } from "@/components/video/call-page";

export default function DoctorCallPage({ params }: PageProps<"/doctor/visits/[id]/call">) {
  const { id } = use(params);
  return <RequireRole role="doctor">{() => <CallPage id={id} role="doctor" backTo={`/doctor/visits/${id}`} />}</RequireRole>;
}
