'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateEducationalContent } from '@/ai/flows/generate-educational-content';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, FileUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  gradeLevel: z.string({ required_error: 'Please select a grade level.' }),
  file: z.instanceof(File).optional(),
});

export default function ContentGenerationPage() {
  const [generatedContent, setGeneratedContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  const fileRef = form.register('file');

  const handleDownload = () => {
    import('jspdf').then(jspdf => {
      const { jsPDF } = jspdf;
      const doc = new jsPDF();
      doc.text(generatedContent, 10, 10);
      doc.save(`${form.getValues('topic')}.pdf`);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      setGeneratedContent('');
      try {
        let fileDataUri: string | undefined = undefined;
        if (values.file) {
          fileDataUri = await fileToBase64(values.file);
        }

        const result = await generateEducationalContent({
          topic: values.topic,
          gradeLevel: values.gradeLevel,
          fileDataUri: fileDataUri,
        });

        if (result.educationalContent) {
          setGeneratedContent(result.educationalContent);
        } else {
            toast({
                title: 'Error',
                description: 'Failed to generate content. Please try again.',
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
            <CardTitle>Generate Educational Content</CardTitle>
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
                        <Input placeholder="e.g., The Water Cycle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (
                            <SelectItem key={i + 1} value={`Grade ${i + 1}`}>
                              Grade {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                    control={form.control}
                    name="file"
                    render={({ field }) => {
                        return (
                        <FormItem>
                            <FormLabel>Upload File (Optional)</FormLabel>
                             <FormControl>
                               <div className="relative">
                                  <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="file"
                                    className="pl-10"
                                    accept="image/*,application/pdf"
                                    {...fileRef}
                                  />
                               </div>
                            </FormControl>
                            <FormDescription>
                                Upload an image or PDF for context.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        );
                    }}
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Generated Content</CardTitle>
             {generatedContent && !isPending && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isPending && (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                </div>
            )}
            {generatedContent ? (
              <Textarea
                readOnly
                className="w-full h-[600px] bg-muted/50 font-mono text-sm whitespace-pre-wrap"
                value={generatedContent}
              />
            ) : !isPending && (
              <div className="text-center text-muted-foreground p-8">
                Your generated educational content will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
