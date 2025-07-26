'use client';

import React, { useState, useTransition, useRef } from 'react';
import { generateWorksheet } from '@/ai/flows/generate-worksheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, MicOff, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WorksheetGenerationPage() {
  const [worksheet, setWorksheet] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null); // Using `any` for SpeechRecognition

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          setIsRecording(true);

          // Speech Recognition
          const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (!SpeechRecognition) {
            toast({
              title: "Browser Not Supported",
              description: "Speech recognition is not supported in your browser. Please try Chrome or Safari.",
              variant: "destructive",
            });
            setIsRecording(false);
            return;
          }

          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognitionRef.current = recognition;

          recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            setTranscribedText(finalTranscript + interimTranscript);
          };

          recognition.onerror = (event) => {
             toast({
              title: "Speech Recognition Error",
              description: event.error,
              variant: "destructive",
            });
            setIsRecording(false);
          };
          
          recognition.onend = () => {
             setIsRecording(false);
          };

          recognition.start();

          // Media Recorder (for visual feedback or if you wanted to store the audio)
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.start();

        })
        .catch(err => {
          console.error('Error accessing microphone:', err);
          toast({
            title: 'Microphone Error',
            description: 'Could not access the microphone. Please check your permissions.',
            variant: 'destructive',
          });
        });
    }
  };

  const handleSubmit = () => {
    if (!transcribedText) {
      toast({
        title: 'No Input',
        description: 'Please record your request first.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      setWorksheet('');
      try {
        const result = await generateWorksheet({ query: transcribedText });
        if (result.worksheet) {
          setWorksheet(result.worksheet);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to generate worksheet. Please try again.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Generate Worksheet via Voice</CardTitle>
             <CardDescription>
              {isRecording ? "Recording... Click the button to stop." : "Click the button and speak your request."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-center items-center">
                <Button 
                    onClick={handleToggleRecording} 
                    size="icon" 
                    className={`h-20 w-20 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary/90'}`}
                >
                    {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </Button>
            </div>
            <div className="space-y-2">
                 <label htmlFor="transcribed-text" className="text-sm font-medium">Your Request</label>
                 <Textarea
                    id="transcribed-text"
                    placeholder="Your transcribed request will appear here... e.g., 'Create a worksheet about the solar system for grade 3 with 5 questions.'"
                    value={transcribedText}
                    onChange={(e) => setTranscribedText(e.target.value)}
                    rows={5}
                    className="bg-muted/50"
                    disabled={isPending || isRecording}
                />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={isPending || isRecording}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate Worksheet
                  </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="min-h-full">
          <CardHeader>
            <CardTitle>Generated Worksheet</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {worksheet ? (
              <Textarea
                readOnly
                className="w-full h-[500px] bg-muted/50 font-mono text-sm"
                value={worksheet}
              />
            ) : !isPending && (
              <div className="text-center text-muted-foreground p-8">
                Your generated worksheet will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
