"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries";

const VideoCall = dynamic(() => import("@/components/video/video-call"), { ssr: false });

/** Full screen call for one visit; both roles use it and return to their visit page after. */
export function CallPage({ id, role, backTo }: { id: string; role: "patient" | "doctor"; backTo: string }) {
  const router = useRouter();
  const qc = useQueryClient();

  const leave = () => {
    qc.invalidateQueries({ queryKey: keys.consultation(id) });
    qc.invalidateQueries({ queryKey: keys.consultations });
    router.push(backTo);
  };

  return <VideoCall consultationId={id} role={role} onLeave={leave} />;
}
