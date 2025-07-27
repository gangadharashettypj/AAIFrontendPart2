"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  CloudOff,
  Hourglass,
  CloudDownload,
  Bot,
  User,
  Send,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GeminiLiveAPI, GeminiLiveResponseMessage } from "@/lib/gemini-live-api";
import {
  LiveAudioInputManager,
  LiveVideoManager,
  LiveScreenManager,
  LiveAudioOutputManager,
} from "@/lib/live-media-manager";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "speaking";
interface Message {
  sender: "user" | "model";
  text: string;
}

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

export function LiveAgent() {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedCam, setSelectedCam] = useState<string>("");
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenOn, setIsScreenOn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textMessage, setTextMessage] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [projectId, setProjectId] = useState("nestbees");
  const [systemInstructions, setSystemInstructions] = useState("");
  const [responseModality, setResponseModality] = useState("AUDIO");
  const [dialogMessage, setDialogMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const geminiApiRef = useRef<GeminiLiveAPI | null>(null);
  const audioInManagerRef = useRef<LiveAudioInputManager | null>(null);
  const audioOutManagerRef = useRef<LiveAudioOutputManager | null>(null);
  const videoManagerRef = useRef<LiveVideoManager | null>(null);
  const screenManagerRef = useRef<LiveScreenManager | null>(null);

  useEffect(() => {
    setAccessToken(getCookie("token") || "");
    setProjectId(getCookie("project") || "nestbees");
    setSystemInstructions(getCookie("systemInstructions") || "");
  }, []);

  useEffect(() => {
    setCookie("token", accessToken);
  }, [accessToken]);
  useEffect(() => {
    setCookie("project", projectId);
  }, [projectId]);
  useEffect(() => {
    setCookie("systemInstructions", systemInstructions);
  }, [systemInstructions]);

  const showDialog = (message: string) => {
    setDialogMessage(message);
    setIsDialogOpen(true);
  };

  const getDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const enumeratedDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(enumeratedDevices);
      const audioDevice = enumeratedDevices.find(d => d.kind === 'audioinput');
      if (audioDevice) setSelectedMic(audioDevice.deviceId);
      const videoDevice = enumeratedDevices.find(d => d.kind === 'videoinput');
      if (videoDevice) setSelectedCam(videoDevice.deviceId);

    } catch (err) {
      console.error("Error enumerating devices:", err);
      toast({
        title: "Media Permissions Error",
        description:
          "Could not access camera and microphone. Please grant permissions in your browser settings.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    getDevices();
  }, [getDevices]);

  const audioInputDevices = devices.filter(
    (device) => device.kind === "audioinput"
  );
  const videoInputDevices = devices.filter(
    (device) => device.kind === "videoinput"
  );

  const handleConnect = () => {
    setStatus("connecting");

    const PROXY_URL = "wss://0124d96229a7.ngrok-free.app"

    const MODEL = "gemini-2.0-flash-live-preview-04-09";
    const API_HOST = "us-central1-aiplatform.googleapis.com";

    const api = new GeminiLiveAPI(PROXY_URL.toString(), projectId, MODEL, API_HOST);
    geminiApiRef.current = api;
    api.responseModalities = [responseModality as "AUDIO" | "TEXT"];
    api.systemInstructions = systemInstructions;

    api.onConnectionStarted = () => {
      setStatus("connected");
      if (isMicOn) {
        audioInManagerRef.current?.connectMicrophone();
      }
    };
    
    api.onErrorMessage = (message) => {
      showDialog(message);
      setStatus("disconnected");
    };
    
    api.onReceiveResponse = (messageResponse: GeminiLiveResponseMessage) => {
        if (messageResponse.type === "AUDIO") {
            audioOutManagerRef.current?.playAudioChunk(messageResponse.data);
        } else if (messageResponse.type === "TEXT") {
            setMessages((prev) => [
                ...prev,
                { sender: "model", text: messageResponse.data },
            ]);
        }
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

    if (videoRef.current && canvasRef.current && !videoManagerRef.current) {
        const videoManager = new LiveVideoManager(videoRef.current, canvasRef.current);
        videoManagerRef.current = videoManager;
        videoManager.onNewFrame = (b64Image) => {
            geminiApiRef.current?.sendImageMessage(b64Image);
        };
    }
    
    if (videoRef.current && canvasRef.current && !screenManagerRef.current) {
        const screenManager = new LiveScreenManager(videoRef.current, canvasRef.current);
        screenManagerRef.current = screenManager;
        screenManager.onNewFrame = (b64Image) => {
            geminiApiRef.current?.sendImageMessage(b64Image);
        };
    }
  };

  const handleDisconnect = () => {
    setStatus("disconnected");
    geminiApiRef.current?.disconnect();
    audioInManagerRef.current?.disconnectMicrophone();
    videoManagerRef.current?.stopWebcam();
    screenManagerRef.current?.stopCapture();
    setIsMicOn(false);
    setIsCamOn(false);
    setIsScreenOn(false);
  };
  
  const handleMicToggle = () => {
      const newMicState = !isMicOn;
      setIsMicOn(newMicState);
      if (newMicState) {
          audioInManagerRef.current?.updateMicrophoneDevice(selectedMic);
          if(status === 'connected') {
            audioInManagerRef.current?.connectMicrophone();
          }
      } else {
          audioInManagerRef.current?.disconnectMicrophone();
      }
  };
  
  const handleCamToggle = () => {
      const newCamState = !isCamOn;
      setIsCamOn(newCamState);
      if(isScreenOn && newCamState) setIsScreenOn(false);

      if (newCamState) {
          videoManagerRef.current?.startWebcam(selectedCam);
      } else {
          videoManagerRef.current?.stopWebcam();
      }
  };

  const handleScreenToggle = () => {
      const newScreenState = !isScreenOn;
      setIsScreenOn(newScreenState);
      if(isCamOn && newScreenState) setIsCamOn(false);

      if (newScreenState) {
          screenManagerRef.current?.startCapture();
      } else {
          screenManagerRef.current?.stopCapture();
      }
  };

  const handleNewMessage = () => {
    if (!textMessage.trim() || status !== 'connected') return;
    setMessages((prev) => [...prev, { sender: "user", text: textMessage }]);
    geminiApiRef.current?.sendTextMessage(textMessage);
    setTextMessage("");
  };
  
  const StatusIndicator = () => {
    const iconClasses = "w-5 h-5 mr-2";
    switch (status) {
      case "connecting":
        return <><Hourglass className={iconClasses} /> Connecting...</>;
      case "connected":
        return <><CloudDownload className={iconClasses} /> Connected</>;
      case "speaking":
        return <><Bot className={iconClasses} /> Model Speaking</>;
      case "disconnected":
      default:
        return <><CloudOff className={iconClasses} /> Disconnected</>;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="token"
              type="password"
              placeholder="Access Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <Input
              id="project"
              placeholder="Project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Model response type</Label>
            <RadioGroup
              value={responseModality}
              onValueChange={setResponseModality}
              className="mt-2 flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AUDIO" id="r-audio" />
                <Label htmlFor="r-audio">Audio</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TEXT" id="r-text" />
                <Label htmlFor="r-text">Text</Label>
              </div>
            </RadioGroup>
          </div>

          <Textarea
            id="systemInstructions"
            placeholder="System Instructions"
            rows={3}
            value={systemInstructions}
            onChange={(e) => setSystemInstructions(e.target.value)}
          />

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

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  onValueChange={(v) => {
                      setSelectedCam(v);
                      if (isCamOn) videoManagerRef.current?.updateWebcamDevice(v);
                  }}
                  value={selectedCam}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoInputDevices.map((d) => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>
                        {d.label || d.deviceId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(v) => {
                      setSelectedMic(v)
                      if (isMicOn) audioInManagerRef.current?.updateMicrophoneDevice(v);
                  }}
                  value={selectedMic}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioInputDevices.map((d) => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>
                        {d.label || d.deviceId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4 flex justify-center gap-4">
                <Button
                  size="icon"
                  variant={isMicOn ? "default" : "outline"}
                  onClick={handleMicToggle}
                  disabled={status === 'disconnected'}
                >
                  {isMicOn ? <Mic /> : <MicOff />}
                </Button>
                <Button
                  size="icon"
                  variant={isCamOn ? "default" : "outline"}
                  onClick={handleCamToggle}
                  disabled={status === 'disconnected'}
                >
                  {isCamOn ? <Video /> : <VideoOff />}
                </Button>
                <Button
                  size="icon"
                  variant={isScreenOn ? "default" : "outline"}
                  onClick={handleScreenToggle}
                  disabled={status === 'disconnected'}
                >
                  <ScreenShare />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted rounded-lg aspect-video flex items-center justify-center relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-lg"
            ></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            {!(isCamOn || isScreenOn) && (
              <VideoOff className="w-16 h-16 text-muted-foreground absolute" />
            )}
          </div>

          <div className="flex flex-col h-64 border rounded-lg p-4 bg-background">
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 ${
                    msg.sender === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.sender === "model" && (
                    <Bot className="w-6 h-6 flex-shrink-0" />
                  )}
                  <p
                    className={`rounded-lg px-4 py-2 ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.text}
                  </p>
                  {msg.sender === "user" && (
                    <User className="w-6 h-6 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Text Message"
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleNewMessage()}
                disabled={status !== 'connected'}
              />
              <Button onClick={handleNewMessage} disabled={status !== 'connected'}>
                <Send />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connection Error</AlertDialogTitle>
            <AlertDialogDescription>{dialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <button onClick={() => setIsDialogOpen(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
