'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Camera,
  Mic,
  Upload,
  Video as VideoIcon,
  Newspaper,
  Users,
  MessageSquare,
  Phone,
  ScreenShare,
} from 'lucide-react';
import Image from 'next/image';

export default function ClassroomPage() {
  const [activeView, setActiveView] = useState<'video' | 'blackboard'>('video');
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-background text-foreground">
      {/* Main Content: Video/Blackboard */}
      <main className="flex-1 flex flex-col p-4 gap-4">
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
              <Button variant={micOn ? 'default' : 'destructive'} size="icon" className="rounded-full h-12 w-12" onClick={() => setMicOn(prev => !prev)}>
                <Mic className="h-6 w-6" />
              </Button>
               <Button variant={cameraOn ? 'default' : 'destructive'} size="icon" className="rounded-full h-12 w-12" onClick={() => setCameraOn(prev => !prev)}>
                <Camera className="h-6 w-6" />
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
  );
}
