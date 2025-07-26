'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateWorksheet } from '@/ai/flows/generate-worksheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Loader2, Download, FileUp, Mic, Type, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DownloadIcon } from 'lucide-react';


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
    path: ['topic'],
});

export default function WorksheetGenerationPage() {
  const [generatedWorksheet, setGeneratedWorksheet] = useState('');
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

  const handleDownload = () => {
    import('jspdf').then(jspdf => {
      const { jsPDF } = jspdf;
      const doc = new jsPDF();
      doc.text(generatedWorksheet, 10, 10);
      doc.save(`${form.getValues('topic') || 'generated-worksheet'}.pdf`);
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
      setGeneratedWorksheet('');

      try {
        let fileDataUri: string | undefined = undefined;
        let topic = values.topic || 'Analyzing file contents...';

        if (values.file) {
          fileDataUri = await fileToBase64(values.file);
        }

        const result = await generateWorksheet({
          topic: topic,
          gradeLevel: values.gradeLevel,
          fileDataUri: fileDataUri,
        });

        if (result.worksheet) {
          setGeneratedWorksheet(result.worksheet);
        } else {
            toast({
                title: 'Error',
                description: 'Failed to generate worksheet. Please try again.',
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
            <CardTitle>Generate Worksheet</CardTitle>
            <CardDescription>Create a worksheet from text, voice, an image, or a PDF.</CardDescription>
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
                        <FormLabel>Topic & Instructions</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Create 5 math problems for Grade 2 about addition." {...field} />
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
                             {form.formState.errors.topic && <FormMessage>{form.formState.errors.topic.message}</FormMessage>}
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
                    'Generate Worksheet'
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
            <CardTitle>Generated Worksheet</CardTitle>
             {generatedWorksheet && !isPending && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <DownloadIcon className="mr-2 h-4 w-4" />
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
            {generatedWorksheet ? (
              <Textarea
                readOnly
                className="w-full h-[600px] bg-muted/50 font-mono text-sm whitespace-pre-wrap"
                value={generatedWorksheet}
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
