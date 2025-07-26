'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateVisualAid } from '@/ai/flows/generate-visual-aid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  type: z.enum(['image', 'video'], {
    required_error: 'You need to select a visual aid type.',
  }),
});

export default function VisualAidPage() {
  const [visualAid, setVisualAid] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      type: 'image',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      setVisualAid('');
      try {
        if(values.type === 'video') {
            toast({
                title: 'Generating Video...',
                description: 'Video generation can take up to a minute. Please be patient.',
            });
        }
        const result = await generateVisualAid(values);
        if (result.visualAid) {
          setVisualAid(result.visualAid);
          toast({
            title: 'Success!',
            description: 'Your visual aid has been generated.',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to generate visual aid. The AI model may be unavailable.',
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Generate Visual Aid</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., A volcano erupting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Type of Visual Aid</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="image" />
                            </FormControl>
                            <FormLabel className="font-normal">Image</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="video" disabled />
                            </FormControl>
                            <FormLabel className="font-normal">Video (soon)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="min-h-full">
          <CardHeader>
            <CardTitle>Generated Visual Aid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
              {isPending ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Generating, please wait...</p>
                  {form.getValues('type') === 'video' && <p className='text-sm'>(This may take up to a minute)</p>}
                </div>
              ) : visualAid ? (
                <Image
                  src={visualAid}
                  alt={form.getValues('topic')}
                  width={1280}
                  height={720}
                  className="rounded-lg object-contain"
                />
              ) : (
                <div className="text-center text-muted-foreground p-8 flex flex-col items-center gap-2">
                    <ImageIcon className="h-10 w-10"/>
                    <p>Your generated visual aid will appear here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
