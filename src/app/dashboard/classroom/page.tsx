'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Mic, Upload, Video as VideoIcon, Newspaper } from 'lucide-react';
import Image from 'next/image';

export default function ClassroomPage() {
  const [activeView, setActiveView] = useState<'video' | 'blackboard'>('video');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Main Content: Video/Blackboard and Teacher Controls */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card className="flex-1 flex flex-col">
          <CardHeader className='flex-row items-center justify-between'>
            <CardTitle>{activeView === 'video' ? 'Live Video Feed' : 'Digital Blackboard'}</CardTitle>
            <div className='flex gap-2'>
              <Button variant={activeView === 'video' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('video')}>
                <VideoIcon className="mr-2 h-4 w-4" />
                Video
              </Button>
              <Button variant={activeView === 'blackboard' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('blackboard')}>
                <Newspaper className="mr-2 h-4 w-4" />
                Blackboard
              </Button>
            </div>
          </CardHeader>
          <CardContent className='flex-1'>
            {activeView === 'video' ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden h-full">
                <Image
                  src="https://placehold.co/1280x720.png"
                  alt="Video stream placeholder"
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="classroom teaching"
                />
                 <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                   <p className="text-white font-semibold">Video Stream Area</p>
                </div>
              </div>
            ) : (
              <Textarea
                className="w-full h-full resize-none text-2xl"
                placeholder="Write on the blackboard..."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teacher Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="https://placehold.co/64x64.png" alt="Teacher" data-ai-hint="teacher avatar" />
                <AvatarFallback>T</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">Mrs. Jessica Smith</h3>
                <p className="text-sm text-muted-foreground">Live</p>
              </div>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="icon">
                <Mic className="h-5 w-5" />
                <span className="sr-only">Toggle Mic</span>
              </Button>
              <Button variant="outline" size="icon">
                <Camera className="h-5 w-5" />
                <span className="sr-only">Toggle Camera</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar: Chat and Interaction */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Class Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto">
            {/* Chat messages would go here */}
            <p className='text-sm text-muted-foreground'>No messages yet.</p>
          </CardContent>
           <CardContent className="pt-0">
            <div className="flex gap-2">
              <Input type="text" placeholder="Type a message..." />
              <Button>Send</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Upload className="mr-2 h-4 w-4" /> Upload File
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
