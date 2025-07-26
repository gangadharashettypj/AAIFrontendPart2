'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Mic,
  MicOff,
  Phone,
  ScreenShare,
  Users,
  MessageSquare,
  Newspaper,
  Video as VideoIcon,
  CloudOff,
  Hourglass,
  CloudDownload,
  Bot,
  X
} from 'lucide-react';
import Image from 'next/image';
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
  LiveAudioOutputManager,
} from "@/lib/live-media-manager";
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "speaking";

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


export default function ClassroomPage() {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'video' | 'blackboard'>('video');
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);

  // Live Agent State
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [accessToken, setAccessToken] = useState("");
  const [projectId, setProjectId] = useState("nestbees");
  const [dialogMessage, setDialogMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMic, setSelectedMic] = useState<string>("");

  const geminiApiRef = useRef<GeminiLiveAPI | null>(null);
  const audioInManagerRef = useRef<LiveAudioInputManager | null>(null);
  const audioOutManagerRef = useRef<LiveAudioOutputManager | null>(null);

  useEffect(() => {
    setAccessToken(getCookie("token") || "");
    setProjectId(getCookie("project") || "nestbees");
  }, []);

  useEffect(() => { setCookie("token", accessToken); }, [accessToken]);
  useEffect(() => { setCookie("project", projectId); }, [projectId]);
  
  const showDialog = (message: string) => {
    setDialogMessage(message);
    setIsDialogOpen(true);
  };
  
  const getDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const enumeratedDevices = await navigator.mediaDevices.enumerateDevices();
      const audioDevice = enumeratedDevices.find(d => d.kind === 'audioinput');
      if (audioDevice) setSelectedMic(audioDevice.deviceId);

    } catch (err) {
      console.error("Error enumerating devices:", err);
      toast({
        title: "Media Permissions Error",
        description: "Could not access microphone. Please grant permissions in your browser settings.",
        variant: "destructive",
      });
    }
  }, [toast]);
  
  useEffect(() => {
    getDevices();
  }, [getDevices]);

  const handleConnect = () => {
    setStatus("connecting");

    const PROXY_URL = "wss://e8a4850bacdc.ngrok-free.app";
    const MODEL = "gemini-2.0-flash-live-preview-04-09";
    const API_HOST = "us-central1-aiplatform.googleapis.com";

    const api = new GeminiLiveAPI(PROXY_URL.toString(), projectId, MODEL, API_HOST);
    geminiApiRef.current = api;
    api.responseModalities = ["AUDIO"];
    api.systemInstructions = "You are a helpful teaching assistant in a classroom.";

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
        if (messageResponse.type === "AUDIO") {
            audioOutManagerRef.current?.playAudioChunk(messageResponse.data);
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
          if(status === 'connected') {
            audioInManagerRef.current?.connectMicrophone();
          }
      } else {
          audioInManagerRef.current?.disconnectMicrophone();
      }
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
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-background text-foreground">
        {/* Connection Controls */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className='flex items-center justify-between'>
             <div className="flex gap-4">
                <Button onClick={handleConnect} disabled={status === "connecting" || status === "connected"}>Connect</Button>
                <Button onClick={handleDisconnect} variant="outline" disabled={status === "disconnected"}>Disconnect</Button>
            </div>
            <div className="flex items-center text-lg font-medium p-3 bg-muted rounded-md">
                <StatusIndicator />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Video/Blackboard */}
      <main className="flex-1 flex flex-col gap-4">
        <div className="flex-1 relative rounded-lg overflow-hidden bg-muted flex items-center justify-center">
           {activeView === 'video' ? (
              <div className="w-full h-full relative">
                <Image
                  src="https://placehold.co/1280x720.png"
                  alt="Video stream placeholder"
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="classroom teaching"
                />
                <div className="absolute bottom-4 left-4">
                    <div className="bg-background/80 backdrop-blur-sm p-2 rounded-lg flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://placehold.co/64x64.png" alt="Teacher" data-ai-hint="teacher avatar" />
                            <AvatarFallback>T</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">Mrs. Jessica Smith</span>
                    </div>
                </div>
              </div>
            ) : (
              <Textarea
                className="w-full h-full resize-none text-2xl bg-white dark:bg-gray-800 border-0"
                placeholder="Digital blackboard..."
              />
            )}
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="w-full p-4 bg-background border-t border-border">
          <div className='flex justify-between items-center'>
            {/* Left: View Switch */}
            <div className='flex gap-2'>
               <Button variant={activeView === 'video' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('video')}>
                <VideoIcon className="mr-2 h-4 w-4" />
                Video
              </Button>
              <Button variant={activeView === 'blackboard' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('blackboard')}>
                <Newspaper className="mr-2 h-4 w-4" />
                Blackboard
              </Button>
            </div>

            {/* Center: Core Controls */}
            <div className="flex items-center gap-3">
              <Button 
                variant={micOn ? 'default' : 'destructive'} 
                size="icon" 
                className="rounded-full h-12 w-12" 
                onClick={handleMicToggle}
                disabled={status === 'disconnected'}
              >
                {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>
               <Button 
                variant={cameraOn ? 'default' : 'destructive'} 
                size="icon" 
                className="rounded-full h-12 w-12" 
                onClick={() => setCameraOn(prev => !prev)}
                >
                <VideoIcon className="h-6 w-6" />
              </Button>
               <Button variant="destructive" size="icon" className="rounded-full h-12 w-12">
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
          <button onClick={() => setIsDialogOpen(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    