"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import AgoraRTC, {
  AgoraRTCProvider,
  LocalVideoTrack,
  RemoteUser,
  useConnectionState,
  useIsConnected,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { Mic, MicOff, PhoneOff, Video as VideoIcon, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/lib/api";
import { video } from "@/lib/queries";

type Props = { consultationId: string; role: "patient" | "doctor"; onLeave: () => void };

/**
 * One consultation call on agora-rtc-react's declarative hooks. Loaded with
 * `dynamic(..., { ssr: false })` because the SDK touches browser globals on import.
 * The server hands out the room token only to the two parties of a paid visit.
 * A retry remounts the call (new key), which resets every hook cleanly.
 */
export default function VideoCall(props: Props) {
  const client = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);
  const [attempt, setAttempt] = useState(0);
  return (
    <AgoraRTCProvider client={client}>
      <Call key={attempt} {...props} onRetry={() => setAttempt((n) => n + 1)} />
    </AgoraRTCProvider>
  );
}

function Call({ consultationId, role, onLeave, onRetry }: Props & { onRetry: () => void }) {
  const t = useTranslations("call");
  const [calling, setCalling] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const token = useQuery({
    queryKey: ["video-token", consultationId],
    queryFn: () => video.token(consultationId),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const session = token.data;

  const isConnected = useIsConnected();
  const connectionState = useConnectionState();
  const { error: joinError } = useJoin(
    { appid: session?.app_id ?? "", channel: session?.channel ?? "", token: session?.token ?? null, uid: session?.uid ?? null },
    calling && !!session,
  );
  const live = calling && !joinError;
  const { localMicrophoneTrack, error: micError } = useLocalMicrophoneTrack(live && micOn);
  const { localCameraTrack, error: camError } = useLocalCameraTrack(live && camOn);
  usePublish([localMicrophoneTrack, localCameraTrack], live && isConnected);
  const remoteUsers = useRemoteUsers();
  const other = remoteUsers[0];

  useEffect(() => {
    if (live && isConnected) video.start(consultationId).catch(() => {});
  }, [live, isConnected, consultationId]);

  const leave = async () => {
    setCalling(false);
    try {
      await video.end(consultationId);
    } finally {
      onLeave();
    }
  };

  if (token.isPending) {
    return (
      <Screen>
        <div className="size-10 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
        <p className="mt-4 text-white/80">{t("preparing")}</p>
      </Screen>
    );
  }

  // derived, never synced through state: a token failure or a failed join shows one problem screen
  const problem = token.error
    ? (() => {
        const e = toApiError(token.error);
        return { text: e.status === 403 ? t("notReady") : e.status ? e.message : t("noConnection"), retry: !e.status || e.status >= 500 };
      })()
    : joinError
      ? { text: t(agoraErrorKey(joinError)), retry: true }
      : null;

  if (problem) {
    return (
      <Screen>
        <div className="max-w-md rounded-2xl bg-background p-6 text-foreground">
          <p className="text-lg font-semibold">{problem.text}</p>
          <div className="mt-5 flex justify-center gap-3">
            {problem.retry && <Button onClick={onRetry}>{t("retry")}</Button>}
            <Button variant="outline" onClick={onLeave}>
              {t("back")}
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  const deviceProblem = micError || camError;

  return (
    <div className="relative h-dvh w-full bg-neutral-900 text-white">
      <div className="absolute inset-0">
        {other ? (
          <RemoteUser user={other} playVideo playAudio className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-xl text-white/80">
              {!calling && t("ready")}
              {calling && !isConnected && `${t("connecting")} (${connectionState.toLowerCase()})`}
              {calling && isConnected && t("waitingFor", { who: role === "doctor" ? t("patient") : t("doctor") })}
            </p>
          </div>
        )}
      </div>

      {live && (
        <div className="absolute top-4 right-4 h-40 w-28 overflow-hidden rounded-xl border border-white/30 bg-neutral-800 sm:h-48 sm:w-64">
          {camOn && localCameraTrack ? (
            <LocalVideoTrack track={localCameraTrack} play className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/70">{t("cameraOff")}</div>
          )}
        </div>
      )}

      <div className="absolute top-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm capitalize">
        {role}
        {live && isConnected && <span className="ml-2 text-emerald-300">{"● "}{t("live")}</span>}
      </div>

      {deviceProblem && live && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900">
          {t(deviceErrorKey(deviceProblem))}
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/60 px-4 py-3">
        {!calling ? (
          <>
            <Button className="h-11 rounded-full bg-emerald-600 px-6 text-base hover:bg-emerald-500" onClick={() => setCalling(true)} disabled={!session}>
              <VideoIcon data-icon="inline-start" />
              {t("join")}
            </Button>
            <Button variant="ghost" className="h-11 rounded-full text-white hover:bg-white/10 hover:text-white" onClick={onLeave}>
              {t("back")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="icon" className="size-11 rounded-full" onClick={() => setMicOn((v) => !v)} aria-label={micOn ? t("mute") : t("unmute")} aria-pressed={!micOn}>
              {micOn ? <Mic /> : <MicOff />}
            </Button>
            <Button variant="secondary" size="icon" className="size-11 rounded-full" onClick={() => setCamOn((v) => !v)} aria-label={camOn ? t("cameraOff") : t("cameraOn")} aria-pressed={!camOn}>
              {camOn ? <VideoIcon /> : <VideoOff />}
            </Button>
            <Button variant="destructive" className="h-11 rounded-full px-6 text-base" onClick={leave}>
              <PhoneOff data-icon="inline-start" />
              {t("leave")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

const Screen = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-dvh flex-col items-center justify-center bg-neutral-900 px-6 text-center text-white">{children}</div>
);

function agoraErrorKey(err: unknown) {
  const e = err as { code?: string; message?: string } | null;
  const text = `${e?.code ?? ""} ${e?.message ?? ""}`;
  if (/CAN_NOT_GET_GATEWAY_SERVER|INVALID_VENDOR_KEY|invalid token/i.test(text)) return "errors.rejectedKey";
  if (/DYNAMIC_KEY_EXPIRED|TOKEN_EXPIRED/i.test(text)) return "errors.expiredKey";
  if (/UID_CONFLICT/i.test(text)) return "errors.otherTab";
  if (/NETWORK|TIMEOUT|WS_ABORT/i.test(text)) return "errors.network";
  return "errors.noAnswer";
}

function deviceErrorKey(err: unknown) {
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code === "PERMISSION_DENIED") return "errors.permission";
  if (code === "DEVICE_NOT_FOUND") return "errors.noDevice";
  if (code === "NOT_READABLE") return "errors.busyDevice";
  return "errors.deviceStart";
}
