'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { answerStudentQuestion } from '@/ai/flows/answer-student-question';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  question: z.string().min(5, { message: 'Question must be at least 5 characters.' }),
  context: z.string().optional(),
});

type Message = {
    role: 'user' | 'bot';
    content: string;
};

export default function QAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      context: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userMessage: Message = { role: 'user', content: values.question };
    setMessages(prev => [...prev, userMessage]);
    form.reset();

    startTransition(async () => {
      try {
        const result = await answerStudentQuestion({
            question: values.question,
            context: values.context || 'No context provided.',
        });
        if (result.answer) {
            const botMessage: Message = { role: 'bot', content: result.answer };
            setMessages(prev => [...prev, botMessage]);
        } else {
            toast({
                title: 'Error',
                description: 'Failed to get an answer. Please try again.',
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
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-10rem)]">
      <div className="lg:col-span-1">
        <Card className='h-full'>
          <CardHeader>
            <CardTitle>Ask Sahayak AI</CardTitle>
            <CardDescription>Get instant answers to student questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student's Question</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Why is the sky blue?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="context"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Context (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide any relevant context from the lesson." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Asking...</>
                  ) : ( 'Ask AI' )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                    {messages.length === 0 && !isPending && (
                        <div className="text-center text-muted-foreground p-8">
                            Your conversation will appear here.
                        </div>
                    )}
                    {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'bot' && <Avatar className="h-8 w-8"><AvatarFallback><Bot/></AvatarFallback></Avatar>}
                        <div className={`rounded-lg p-3 max-w-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && <Avatar className="h-8 w-8"><AvatarFallback><User/></AvatarFallback></Avatar>}
                    </div>
                    ))}
                    {isPending && messages[messages.length-1].role === 'user' &&(
                         <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8"><AvatarFallback><Bot/></AvatarFallback></Avatar>
                            <div className="rounded-lg p-3 max-w-lg bg-muted flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
