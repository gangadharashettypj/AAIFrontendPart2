"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAgentManager } from "@/hooks/useAgentManager";
import { ChatMode, ConnectionState, Message } from "@d-id/client-sdk";

import {
  Mic,
  MicOff,
  Phone,
  ScreenShare,
  Users,
  MessageSquare,
  Video as VideoIcon,
  CloudOff,
  Hourglass,
  CloudDownload,
  Bot,
  X,
  VideoOff,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  GeminiLiveAPI,
  GeminiLiveResponseMessage,
} from "@/lib/gemini-live-api";
import {
  LiveAudioInputManager,
  LiveAudioOutputManager,
} from "@/lib/live-media-manager";
import { useToast } from "@/hooks/use-toast";
import ChalkText from "@/components/ChatText";
import AvatarView from "@/components/AvatarView";
import { postData } from "@/lib/ragApi";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "speaking";

const setCookie = (name: string, value: string, days: number = 365) => {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(
    value
  )};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const cookieValue = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
  return cookieValue ? decodeURIComponent(cookieValue.pop() || "") : null;
};

export default function DiscussionPage() {
  const { toast } = useToast();
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [blackboardText, setBlackboardText] = useState("Welcome to the class!");

  // Live Agent State
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [accessToken, setAccessToken] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [resMessages, setMessages] = useState<string>("");

  const geminiApiRef = useRef<GeminiLiveAPI | null>(null);
  const audioInManagerRef = useRef<LiveAudioInputManager | null>(null);
  const audioOutManagerRef = useRef<LiveAudioOutputManager | null>(null);

  const [text, setText] = useState("Hello");
  const [mode, setMode] = useState<ChatMode>(ChatMode.Functional);

  const videoRef = useRef<HTMLVideoElement>(null);

  const didApiUrl = "https://api.d-id.com";
  const didSocketApiUrl = "wss://notifications.d-id.com";
  const agentId = "v2_agt_KCm-2Vmm";
  const clientKey =
    "Z29vZ2xlLW9hdXRoMnwxMDE2MDE2MTMzODUzNTI2NTA4OTk6aFFTek04Y3FscHFWLUNTMkwwblhp";

  const {
    srcObject,
    connectionState,
    messages,
    isSpeaking,
    connect,
    disconnect,
    speak,
    chat,
  } = useAgentManager({
    agentId,
    baseURL: didApiUrl,
    wsURL: didSocketApiUrl,
    mode,
    enableAnalytics: false,
    auth: { type: "key", clientKey },
    streamOptions: {},
  });

  async function onClick() {
    if (
      connectionState === ConnectionState.New ||
      connectionState === ConnectionState.Fail
    ) {
      await connect();
    } else if (connectionState === ConnectionState.Connected && text) {
      await speak(text);
    }
  }

  useEffect(() => {
    if (srcObject && videoRef.current) {
      videoRef.current.srcObject = srcObject;
    }
  }, [srcObject]);

  useEffect(() => {
    setAccessToken(getCookie("token") || "");
  }, []);

  useEffect(() => {
    setCookie("token", accessToken);
  }, [accessToken]);

  const showDialog = (message: string) => {
    setDialogMessage(message);
    setIsDialogOpen(true);
  };

  const getDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const enumeratedDevices = await navigator.mediaDevices.enumerateDevices();
      const audioDevice = enumeratedDevices.find(
        (d) => d.kind === "audioinput"
      );
      if (audioDevice) setSelectedMic(audioDevice.deviceId);
    } catch (err) {
      console.error("Error enumerating devices:", err);
      toast({
        title: "Media Permissions Error",
        description:
          "Could not access microphone. Please grant permissions in your browser settings.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    getDevices();
  }, [getDevices]);

  useEffect(() => {
    const interval = setTimeout(async () => {
      if (resMessages === "") {
        return;
      }
      console.log(resMessages);
      setBlackboardText(resMessages);
      await speak(resMessages);
      // postData(resMessages).then((resp) => {
      //   if (resp) {
      //     console.log("API Response:", resp);
      //     setBlackboardText(resp.report.prompt);
      //     speak(resp.report.script);
      //   } else {
      //     console.log("Failed to get a valid response");
      //   }
      // });
      setMessages("");
    }, 500);

    return () => clearInterval(interval);
  }, [resMessages]);

  const handleConnect = () => {
    setStatus("connecting");

    const PROXY_URL = "wss://0124d96229a7.ngrok-free.app"
    const MODEL = "gemini-2.0-flash-live-preview-04-09";
    const API_HOST = "us-central1-aiplatform.googleapis.com";
    const projectId = "nestbees";

    const api = new GeminiLiveAPI(
      PROXY_URL.toString(),
      projectId,
      MODEL,
      API_HOST
    );
    geminiApiRef.current = api;
    api.responseModalities = ["TEXT"];

    api.systemInstructions =
      "You are a helpful teaching assistant in a classroom.";

    api.onConnectionStarted = () => {
      setStatus("connected");
      if (micOn) {
        audioInManagerRef.current?.connectMicrophone();
      }
    };

    api.onErrorMessage = (message) => {
      showDialog(message);
      setStatus("disconnected");
    };
    api.onReceiveResponse = (messageResponse: GeminiLiveResponseMessage) => {
      setMessages((prev) => (prev += messageResponse.data));
    };

    api.setProjectId(projectId);
    api.connect(accessToken);

    if (!audioOutManagerRef.current) {
      audioOutManagerRef.current = new LiveAudioOutputManager();
    }

    if (!audioInManagerRef.current) {
      const audioInManager = new LiveAudioInputManager();
      audioInManagerRef.current = audioInManager;
      audioInManager.onNewAudioRecordingChunk = (audioData) => {
        geminiApiRef.current?.sendAudioMessage(audioData);
      };
    }
  };

  const handleDisconnect = () => {
    setStatus("disconnected");
    geminiApiRef.current?.disconnect();
    audioInManagerRef.current?.disconnectMicrophone();
    setMicOn(false);
  };

  const handleMicToggle = () => {
    const newMicState = !micOn;
    setMicOn(newMicState);
    if (newMicState) {
      audioInManagerRef.current?.updateMicrophoneDevice(selectedMic);
      if (status === "connected") {
        audioInManagerRef.current?.connectMicrophone();
      }
    } else {
      audioInManagerRef.current?.disconnectMicrophone();
    }
  };

  useEffect(() => {
    if (cameraOn && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Error accessing camera:", err));
    } else {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraOn]);

  const StatusIndicator = () => {
    const iconClasses = "w-5 h-5 mr-2";
    switch (status) {
      case "connecting":
        return (
          <>
            <Hourglass className={iconClasses} /> Connecting...
          </>
        );
      case "connected":
        return (
          <>
            <CloudDownload className={iconClasses} /> Connected
          </>
        );
      case "speaking":
        return (
          <>
            <Bot className={iconClasses} /> Model Speaking
          </>
        );
      case "disconnected":
      default:
        return (
          <>
            <CloudOff className={iconClasses} /> Disconnected
          </>
        );
    }
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-10rem)] bg-background text-foreground">
        {/* Connection Controls */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Input
                id="token"
                type="password"
                placeholder="Access Token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Button
                  onClick={handleConnect}
                  disabled={status === "connecting" || status === "connected"}
                >
                  Connect
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  disabled={status === "disconnected"}
                >
                  Disconnect
                </Button>
              </div>
              <div className="flex items-center text-lg font-medium p-3 bg-muted rounded-md">
                <StatusIndicator />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content: Video/Blackboard */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="flex-1 flex items-center justify-center">
            <CardContent className="w-full h-full p-4">
              <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
                <ChalkText text={blackboardText} />
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1 flex items-center justify-center">
            <CardContent className="w-full h-full p-4">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Card className="mb-4">
                  <CardContent className="p-4 space-y-4 flex gap-4">
                    <textarea
                      // type="text"
                      placeholder="Enter text to stream"
                      value={text}
                      onInput={(e) => setText(e.currentTarget.value)}
                    />

                    <fieldset
                      id="main-input"
                      disabled={connectionState === ConnectionState.Connecting}
                    >
                      <Button
                        onClick={onClick}
                        disabled={
                          isSpeaking ||
                          (!text &&
                            ![
                              ConnectionState.New,
                              ConnectionState.Fail,
                            ].includes(connectionState))
                        }
                      >
                        {connectionState === ConnectionState.Connected
                          ? "Send"
                          : connectionState === ConnectionState.Connecting
                          ? "Connecting..."
                          : connectionState === ConnectionState.Fail
                          ? "Failed, Try Again"
                          : "Connect"}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={disconnect}
                        disabled={connectionState !== ConnectionState.Connected}
                      >
                        Close Connection
                      </Button>
                    </fieldset>
                  </CardContent>
                </Card>
                <main className="flex-1 flex flex-col gap-4">
                  <div className="flex-1 relative rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <div id="app">
                      <video
                        ref={videoRef}
                        id="main-video"
                        autoPlay
                        playsInline
                        className={
                          connectionState === ConnectionState.Connecting
                            ? "animated"
                            : ""
                        }
                      />
                    </div>
                  </div>
                </main>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Controls */}
        <footer className="w-full p-4 bg-background border-t border-border mt-4">
          <div className="flex justify-between items-center">
            {/* Left: View Switch */}
            <div className="flex gap-2"></div>

            {/* Center: Core Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant={micOn ? "default" : "destructive"}
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={handleMicToggle}
                disabled={status === "disconnected"}
              >
                {micOn ? (
                  <Mic className="h-6 w-6" />
                ) : (
                  <MicOff className="h-6 w-6" />
                )}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant={cameraOn ? "default" : "destructive"}
                  size="icon"
                  className="rounded-full h-12 w-12"
                  onClick={() => setCameraOn((prev) => !prev)}
                >
                  {cameraOn ? (
                    <VideoIcon className="h-6 w-6" />
                  ) : (
                    <VideoOff className="h-6 w-6" />
                  )}
                </Button>
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full h-12 w-12"
              >
                <Phone className="h-6 w-6" />
              </Button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <ScreenShare className="h-5 w-5" />
                <span className="sr-only">Share Screen</span>
              </Button>
              <Button variant="ghost" size="icon">
                <Users className="h-5 w-5" />
                <span className="sr-only">Participants</span>
              </Button>
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">Chat</span>
              </Button>
            </div>
          </div>
        </footer>
      </div>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connection Error</AlertDialogTitle>
            <AlertDialogDescription>{dialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <button
            onClick={() => setIsDialogOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
