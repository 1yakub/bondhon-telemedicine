"use client";

import { useEffect, useMemo, useState } from "react";
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

/**
 * One consultation call. The whole component is loaded with `dynamic(..., { ssr: false })`
 * by the two video call pages, because the Agora SDK touches browser globals on import.
 *
 * Flow: fetch a token from our API (the server checks the user owns the consultation and
 * that it is paid), let the user press Join, then the declarative hooks join, publish and
 * subscribe. Nothing is called imperatively; the `calling` flag drives every hook.
 */
const VideoCall = ({ consultationId, userRole, onCallEnd }) => {
  // one engine per mounted call, never at module scope
  const client = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);
  return (
    <AgoraRTCProvider client={client}>
      <Call consultationId={consultationId} userRole={userRole} onCallEnd={onCallEnd} />
    </AgoraRTCProvider>
  );
};

const api = (path, init) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...init,
  });

const Call = ({ consultationId, userRole, onCallEnd }) => {
  const [session, setSession] = useState(null); // { appId, channel, token, uid }
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState(null); // { title, detail, retry }
  const [calling, setCalling] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [ending, setEnding] = useState(false);

  const isConnected = useIsConnected();
  const connectionState = useConnectionState();

  const { localMicrophoneTrack, error: micError } = useLocalMicrophoneTrack(calling && micOn);
  const { localCameraTrack, error: camError } = useLocalCameraTrack(calling && camOn);

  const { error: joinError } = useJoin(
    {
      appid: session?.appId ?? "",
      channel: session?.channel ?? "",
      token: session?.token ?? null,
      uid: session?.uid ?? null,
    },
    calling && !!session,
  );

  usePublish([localMicrophoneTrack, localCameraTrack], calling && isConnected);

  const remoteUsers = useRemoteUsers();
  const other = remoteUsers[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setProblem(null);
      try {
        const res = await api(`/consultations/${consultationId}/video/token`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.success) {
          setSession(data.data);
        } else if (res.status === 403) {
          setProblem({ title: "This consultation is not ready", detail: data.message || "Payment has not been confirmed." });
        } else if (res.status === 401) {
          setProblem({ title: "Please sign in again", detail: "Your session has ended." });
        } else {
          setProblem({ title: "Could not prepare the call", detail: data.message || "The server did not return a call token.", retry: true });
        }
      } catch {
        if (!cancelled) setProblem({ title: "No connection to the server", detail: "Check your internet connection and try again.", retry: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [consultationId]);

  useEffect(() => {
    if (!calling || !joinError) return;
    // leave the channel state and show the reason with a retry, instead of "connecting" forever
    setCalling(false);
    setProblem({ title: "Could not join the call", detail: describeAgoraError(joinError), retry: true });
  }, [joinError, calling]);

  useEffect(() => {
    if (calling && isConnected) {
      api(`/consultations/${consultationId}/video/start`, { method: "POST" }).catch(() => {});
    }
  }, [calling, isConnected, consultationId]);

  const deviceProblem = micError || camError;

  const endCall = async () => {
    setEnding(true);
    setCalling(false);
    try {
      await api(`/consultations/${consultationId}/video/end`, { method: "POST" });
    } catch {
      // the call is over either way
    }
    onCallEnd?.();
  };

  if (loading) {
    return <Screen><Spinner /><p className="mt-4 text-slate-300">Preparing your consultation…</p></Screen>;
  }

  if (problem && !calling) {
    return (
      <Screen>
        <div className="max-w-md rounded-2xl bg-white p-6 text-center text-slate-800">
          <p className="text-lg font-semibold">{problem.title}</p>
          <p className="mt-2 text-slate-600">{problem.detail}</p>
          <div className="mt-5 flex justify-center gap-3">
            {problem.retry && (
              <button onClick={() => { setProblem(null); setCalling(false); setSession(null); setLoading(true); setTimeout(() => setLoading(false), 0); }} className="rounded-lg bg-slate-900 px-4 py-2 text-white">Try again</button>
            )}
            <button onClick={() => onCallEnd?.()} className="rounded-lg border border-slate-300 px-4 py-2">Back</button>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-900 text-white">
      {/* the other participant fills the screen */}
      <div className="absolute inset-0">
        {other ? (
          <RemoteUser user={other} playVideo playAudio className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-xl text-slate-200">
              {!calling && "Ready when you are. Your camera turns on after you join."}
              {calling && !isConnected && `Connecting… (${connectionState.toLowerCase()})`}
              {calling && isConnected && `Waiting for the ${userRole === "doctor" ? "patient" : "doctor"} to join.`}
            </p>
          </div>
        )}
      </div>

      {/* self view */}
      {calling && (
        <div className="absolute right-4 top-4 h-40 w-28 overflow-hidden rounded-xl border border-white/30 bg-slate-800 sm:h-48 sm:w-64">
          {camOn && localCameraTrack ? (
            <LocalVideoTrack track={localCameraTrack} play className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">Camera off</div>
          )}
        </div>
      )}

      {/* role and state */}
      <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-sm">
        {userRole === "doctor" ? "Doctor" : "Patient"}
        {calling && isConnected && <span className="ml-2 text-emerald-300">● live</span>}
      </div>

      {deviceProblem && calling && (
        <div className="absolute left-1/2 top-16 -translate-x-1/2 rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900">
          {describeDeviceError(deviceProblem)}
        </div>
      )}

      {/* controls */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/60 px-5 py-3">
        {!calling ? (
          <button onClick={() => { setProblem(null); setCalling(true); }} disabled={!session} className="rounded-full bg-emerald-600 px-6 py-3 font-medium hover:bg-emerald-500 disabled:opacity-50">
            Join call
          </button>
        ) : (
          <>
            <Control on={micOn} onClick={() => setMicOn((v) => !v)} labelOn="Mute" labelOff="Unmute" />
            <Control on={camOn} onClick={() => setCamOn((v) => !v)} labelOn="Camera off" labelOff="Camera on" />
            <button onClick={endCall} disabled={ending} className="rounded-full bg-red-600 px-6 py-3 font-medium hover:bg-red-500 disabled:opacity-50">
              End call
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const Control = ({ on, onClick, labelOn, labelOff }) => (
  <button onClick={onClick} className={`rounded-full px-4 py-3 text-sm font-medium ${on ? "bg-slate-600 hover:bg-slate-500" : "bg-red-600 hover:bg-red-500"}`}>
    {on ? labelOn : labelOff}
  </button>
);

const Screen = ({ children }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6 text-center text-white">{children}</div>
);

const Spinner = () => <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-500 border-t-white" />;

function describeAgoraError(err) {
  const text = `${err?.code || ""} ${err?.message || ""}`;
  if (/CAN_NOT_GET_GATEWAY_SERVER|INVALID_VENDOR_KEY|invalid vendor key|invalid token/i.test(text)) return "The call service rejected this room key. Please try again in a moment.";
  if (/DYNAMIC_KEY_EXPIRED|TOKEN_EXPIRED/i.test(text)) return "The call key expired. Reload the page to get a new one.";
  if (/UID_CONFLICT/i.test(text)) return "You are already in this call in another tab.";
  if (/NETWORK|TIMEOUT|WS_ABORT/i.test(text)) return "The network dropped while connecting. Check your connection and try again.";
  return "The call service did not answer. Please try again.";
}

function describeDeviceError(err) {
  const code = err?.code || "";
  if (code === "PERMISSION_DENIED") return "Allow camera and microphone in your browser to be seen and heard.";
  if (code === "DEVICE_NOT_FOUND") return "No camera or microphone was found on this device.";
  if (code === "NOT_READABLE") return "Another app is using your camera or microphone.";
  return "Camera or microphone could not start.";
}

export default VideoCall;
