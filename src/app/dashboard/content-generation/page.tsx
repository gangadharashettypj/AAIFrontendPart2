
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
import { Loader2, Download, FileUp, Mic, Type, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';


const formSchema = z.object({
  topic: z.string().optional(),
  gradeLevel: z.string({ required_error: 'Please select a grade level.' }),
  file: z.instanceof(File).optional(),
  inputType: z.enum(['text', 'audio', 'image', 'pdf']).default('text'),
}).refine(data => {
    if (data.inputType === 'text') {
        return !!data.topic && data.topic.trim().length > 0;
    }
    return !!data.file;
}, {
    message: 'Please provide a topic or upload a file.',
    path: ['topic'], // This will show error on topic field, we'll handle showing it on file field in the component
});

export default function ContentGenerationPage() {
  const [generatedContent, setGeneratedContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      inputType: 'text',
      file: undefined,
    },
  });

  const fileRef = form.register('file');

  const handleDownload = () => {
    import('jspdf').then(jspdf => {
      const { jsPDF } = jspdf;
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;

      const markdownElement = document.querySelector('.markdown-body');
      if (!markdownElement) return;

      doc.html(markdownElement as HTMLElement, {
        callback: function (doc) {
          const pageCount = doc.internal.getNumberOfPages();
          for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Header
            doc.setFontSize(10);
            doc.text(form.getValues('topic') || 'Generated Content', margin, 10);
            
            // Footer
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

            // Border
            doc.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin, 'S');
          }
          doc.save(`${form.getValues('topic') || 'generated-content'}.pdf`);
        },
        x: margin,
        y: margin,
        width: contentWidth,
        windowWidth: 800,
        margin: [15, 0, 15, 0]
      });
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
  
  const inputType = form.watch('inputType');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      setGeneratedContent('');

      try {
        let fileDataUri: string | undefined = undefined;
        let topic = values.topic || 'Analyzing file contents...';

        if (values.file) {
          fileDataUri = await fileToBase64(values.file);
        }

        const result = await generateEducationalContent({
          topic: topic,
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
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({
            title: 'Error',
            description: errorMessage,
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
                  name="inputType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Input Type</FormLabel>
                       <Tabs
                          defaultValue={field.value}
                          onValueChange={(value) => {
                            const newType = value as 'text' | 'audio' | 'image' | 'pdf';
                            field.onChange(newType);
                            form.setValue('file', undefined);
                            form.setValue('topic', '');
                            form.clearErrors('topic');
                            form.clearErrors('file');
                          }}
                          className="w-full"
                        >
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="text"><Type className="h-4 w-4 mr-2"/>Text</TabsTrigger>
                            <TabsTrigger value="audio"><Mic className="h-4 w-4 mr-2"/>Audio</TabsTrigger>
                            <TabsTrigger value="image"><ImageIcon className="h-4 w-4 mr-2"/>Image</TabsTrigger>
                            <TabsTrigger value="pdf"><FileIcon className="h-4 w-4 mr-2"/>PDF</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {inputType === 'text' ? (
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
                ) : (
                  <FormField
                    control={form.control}
                    name="file"
                    render={({ field }) => {
                        return (
                        <FormItem>
                            <FormLabel>Upload {inputType.charAt(0).toUpperCase() + inputType.slice(1)} File</FormLabel>
                             <FormControl>
                               <div className="relative">
                                  <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="file"
                                    className="pl-10"
                                    accept={
                                        inputType === 'audio' ? 'audio/*' :
                                        inputType === 'image' ? 'image/*' :
                                        inputType === 'pdf' ? 'application/pdf' :
                                        ''
                                    }
                                    onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                  />
                               </div>
                            </FormControl>
                            <FormDescription>
                                The AI will analyze the file to determine the topic.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        );
                    }}
                />
                )}


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
                <ScrollArea className="h-[600px] w-full">
                    <div className="prose dark:prose-invert lg:prose-xl markdown-body p-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {generatedContent}
                        </ReactMarkdown>
                    </div>
                </ScrollArea>
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

    