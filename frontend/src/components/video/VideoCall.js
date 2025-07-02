"use client";

import { useState, useEffect } from "react";
import AgoraRTC, {
  AgoraRTCProvider,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteAudioTracks,
  useRemoteUsers,
} from "agora-rtc-react";

// Create Agora client
const agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const VideoCall = ({ consultationId, userRole, onCallEnd }) => {
  return (
    <AgoraRTCProvider client={agoraEngine}>
      <VideoCallContent
        consultationId={consultationId}
        userRole={userRole}
        onCallEnd={onCallEnd}
      />
    </AgoraRTCProvider>
  );
};

const VideoCallContent = ({ consultationId, userRole, onCallEnd }) => {
  const [channelName, setChannelName] = useState("");
  const [token, setToken] = useState("");
  const [uid, setUid] = useState("");
  const [appId, setAppId] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callStarted, setCallStarted] = useState(false);

  // Agora hooks
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);

  const join = useJoin(
    {
      appid: appId,
      channel: channelName,
      token: token,
      uid: uid,
    },
    isJoined
  );

  usePublish([localMicrophoneTrack, localCameraTrack]);

  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // Play remote audio tracks
  useEffect(() => {
    audioTracks.forEach((track) => track.play());
  }, [audioTracks]);

  // Fetch video token and session details
  useEffect(() => {
    fetchVideoToken();
  }, [consultationId]);

  const fetchVideoToken = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/consultations/${consultationId}/video/token`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setChannelName(data.data.channel);
        setToken(data.data.token);
        setUid(data.data.uid);
        setAppId(data.data.appId);
      } else {
        setError(data.message || "Failed to get video token");
      }
    } catch (err) {
      setError("Failed to connect to video service");
      console.error("Video token error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCall = async () => {
    try {
      setIsJoined(true);
      await join();

      if (!callStarted) {
        // Mark session as started
        await startVideoSession();
        setCallStarted(true);
      }
    } catch (err) {
      console.error("Failed to join call:", err);
      setError("Failed to join video call");
      setIsJoined(false);
    }
  };

  const handleEndCall = async () => {
    try {
      // End the session
      await endVideoSession();

      // Leave the channel
      setIsJoined(false);

      // Call parent callback
      if (onCallEnd) {
        onCallEnd();
      }
    } catch (err) {
      console.error("Failed to end call:", err);
    }
  };

  const startVideoSession = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/consultations/${consultationId}/video/start`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const endVideoSession = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/consultations/${consultationId}/video/end`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  const toggleMicrophone = () => {
    setMicOn(!micOn);
  };

  const toggleCamera = () => {
    setCameraOn(!cameraOn);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading video call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Video Call Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={fetchVideoToken}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Video Container */}
      <div className="relative w-full h-screen">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0">
          {remoteUsers.length > 0 ? (
            <RemoteVideoPlayer user={remoteUsers[0]} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-800 text-white">
              <div className="text-center">
                <div className="text-6xl mb-4">👨‍⚕️</div>
                <p className="text-xl">
                  {isJoined
                    ? "Waiting for other participant..."
                    : "Ready to join video consultation"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        {isJoined && (
          <div className="absolute top-4 right-4 w-64 h-48 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
            <LocalVideoPlayer
              cameraTrack={localCameraTrack}
              microphoneTrack={localMicrophoneTrack}
              cameraOn={cameraOn}
              micOn={micOn}
            />
          </div>
        )}

        {/* Call Controls */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-4 bg-black bg-opacity-50 rounded-full px-6 py-3">
            {!isJoined ? (
              <button
                onClick={handleJoinCall}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium"
              >
                Join Call
              </button>
            ) : (
              <>
                {/* Microphone Toggle */}
                <button
                  onClick={toggleMicrophone}
                  className={`p-3 rounded-full ${
                    micOn ? "bg-gray-600" : "bg-red-600"
                  } text-white hover:opacity-80`}
                >
                  {micOn ? "🎤" : "🔇"}
                </button>

                {/* Camera Toggle */}
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full ${
                    cameraOn ? "bg-gray-600" : "bg-red-600"
                  } text-white hover:opacity-80`}
                >
                  {cameraOn ? "📹" : "📹"}
                </button>

                {/* End Call */}
                <button
                  onClick={handleEndCall}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium"
                >
                  End Call
                </button>
              </>
            )}
          </div>
        </div>

        {/* User Role Badge */}
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
          {userRole === "doctor" ? "👨‍⚕️ Doctor" : "🧑‍🦱 Patient"}
        </div>
      </div>
    </div>
  );
};

// Local Video Player Component
const LocalVideoPlayer = ({
  cameraTrack,
  microphoneTrack,
  cameraOn,
  micOn,
}) => {
  useEffect(() => {
    if (cameraTrack && cameraOn) {
      cameraTrack.play("local-video");
    }
  }, [cameraTrack, cameraOn]);

  return (
    <div className="relative w-full h-full">
      {cameraOn ? (
        <div id="local-video" className="w-full h-full"></div>
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-600 text-white">
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <p className="text-sm">Camera Off</p>
          </div>
        </div>
      )}

      {/* Mic indicator */}
      <div className="absolute bottom-2 left-2">
        <span
          className={`text-xs ${micOn ? "text-green-400" : "text-red-400"}`}
        >
          {micOn ? "🎤" : "🔇"}
        </span>
      </div>
    </div>
  );
};

// Remote Video Player Component
const RemoteVideoPlayer = ({ user }) => {
  useEffect(() => {
    if (user.videoTrack) {
      user.videoTrack.play("remote-video");
    }
  }, [user]);

  return (
    <div className="relative w-full h-full">
      {user.videoTrack ? (
        <div id="remote-video" className="w-full h-full"></div>
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-700 text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-xl">Participant joined (video off)</p>
          </div>
        </div>
      )}

      {/* Audio indicator */}
      <div className="absolute bottom-4 left-4">
        <span
          className={`text-lg ${
            user.audioTrack ? "text-green-400" : "text-red-400"
          }`}
        >
          {user.audioTrack ? "🎤" : "🔇"}
        </span>
      </div>
    </div>
  );
};

export default VideoCall;
