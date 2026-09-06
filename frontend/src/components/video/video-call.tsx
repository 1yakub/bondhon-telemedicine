"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
import type { VideoSession } from "@/lib/types";

type Props = { consultationId: string; role: "patient" | "doctor"; onLeave: () => void };

/**
 * One consultation call on agora-rtc-react's declarative hooks. Loaded with
 * `dynamic(..., { ssr: false })` because the SDK touches browser globals on import.
 * The server hands out the room token only to the two parties of a paid visit.
 */
export default function VideoCall(props: Props) {
  const client = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);
  return (
    <AgoraRTCProvider client={client}>
      <Call {...props} />
    </AgoraRTCProvider>
  );
}

function Call({ consultationId, role, onLeave }: Props) {
  const t = useTranslations("call");
  const [session, setSession] = useState<VideoSession | null>(null);
  const [problem, setProblem] = useState<{ text: string; retry: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const isConnected = useIsConnected();
  const connectionState = useConnectionState();
  const { localMicrophoneTrack, error: micError } = useLocalMicrophoneTrack(calling && micOn);
  const { localCameraTrack, error: camError } = useLocalCameraTrack(calling && camOn);
  const { error: joinError } = useJoin(
    { appid: session?.app_id ?? "", channel: session?.channel ?? "", token: session?.token ?? null, uid: session?.uid ?? null },
    calling && !!session,
  );
  usePublish([localMicrophoneTrack, localCameraTrack], calling && isConnected);
  const remoteUsers = useRemoteUsers();
  const other = remoteUsers[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProblem(null);
    video
      .token(consultationId)
      .then((s) => !cancelled && setSession(s))
      .catch((err) => {
        if (cancelled) return;
        const e = toApiError(err);
        setProblem({ text: e.status === 403 ? t("notReady") : e.status ? e.message : t("noConnection"), retry: !e.status || e.status >= 500 });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [consultationId, attempt, t]);

  useEffect(() => {
    if (calling && joinError) {
      setCalling(false);
      setProblem({ text: describeAgoraError(joinError), retry: true });
    }
  }, [joinError, calling]);

  useEffect(() => {
    if (calling && isConnected) video.start(consultationId).catch(() => {});
  }, [calling, isConnected, consultationId]);

  const leave = async () => {
    setCalling(false);
    try {
      await video.end(consultationId);
    } finally {
      onLeave();
    }
  };

  if (loading) {
    return (
      <Screen>
        <div className="size-10 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
        <p className="mt-4 text-white/80">{t("preparing")}</p>
      </Screen>
    );
  }

  if (problem && !calling) {
    return (
      <Screen>
        <div className="max-w-md rounded-2xl bg-background p-6 text-foreground">
          <p className="text-lg font-semibold">{problem.text}</p>
          <div className="mt-5 flex justify-center gap-3">
            {problem.retry && <Button onClick={() => setAttempt((n) => n + 1)}>{t("retry")}</Button>}
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

      {calling && (
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
        {calling && isConnected && <span className="ml-2 text-emerald-300">{"● "}{t("live")}</span>}
      </div>

      {deviceProblem && calling && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900">
          {describeDeviceError(deviceProblem)}
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

function describeAgoraError(err: unknown) {
  const e = err as { code?: string; message?: string } | null;
  const text = `${e?.code ?? ""} ${e?.message ?? ""}`;
  if (/CAN_NOT_GET_GATEWAY_SERVER|INVALID_VENDOR_KEY|invalid token/i.test(text)) return "The call service rejected this room key. Please try again in a moment.";
  if (/DYNAMIC_KEY_EXPIRED|TOKEN_EXPIRED/i.test(text)) return "The call key expired. Reload the page to get a new one.";
  if (/UID_CONFLICT/i.test(text)) return "You are already in this call in another tab.";
  if (/NETWORK|TIMEOUT|WS_ABORT/i.test(text)) return "The network dropped while connecting. Check your connection and try again.";
  return "The call service did not answer. Please try again.";
}

function describeDeviceError(err: unknown) {
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code === "PERMISSION_DENIED") return "Allow camera and microphone in your browser to be seen and heard.";
  if (code === "DEVICE_NOT_FOUND") return "No camera or microphone was found on this device.";
  if (code === "NOT_READABLE") return "Another app is using your camera or microphone.";
  return "Camera or microphone could not start.";
}
