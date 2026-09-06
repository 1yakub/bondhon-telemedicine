"use client";

import { use } from "react";
import { RequireRole } from "@/components/require-role";
import { CallPage } from "@/components/video/call-page";

export default function PatientCallPage({ params }: PageProps<"/visits/[id]/call">) {
  const { id } = use(params);
  return <RequireRole role="patient">{() => <CallPage id={id} role="patient" backTo={`/visits/${id}`} />}</RequireRole>;
}
