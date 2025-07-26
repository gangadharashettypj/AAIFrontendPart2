
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
import { Loader2, Printer, FileUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';


const formSchema = z.object({
  criticality: z.string({ required_error: 'Please select a criticality level.' }),
  file: z.instanceof(File).refine(file => file.size > 0, 'Please upload a PDF file.'),
});

export default function WorksheetGenerationPage() {
  const [generatedWorksheet, setGeneratedWorksheet] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
    },
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const markdownElement = document.querySelector('.markdown-worksheet');
      if (!markdownElement) return;

      const printableContent = `
        <html>
          <head>
            <title>Print Worksheet</title>
            <style>
                @media print {
                    body {
                        font-family: sans-serif;
                        padding: 2rem;
                    }
                    .prose {
                        max-width: 100%;
                    }
                }
            </style>
          </head>
          <body>
            <div class="prose">${markdownElement.innerHTML}</div>
          </body>
        </html>
      `;
      printWindow.document.write(printableContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
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
      setGeneratedWorksheet('');

      try {
        const fileDataUri = await fileToBase64(values.file);

        const result = await generateWorksheet({
          criticality: values.criticality as 'low' | 'medium' | 'high',
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
            <CardDescription>Create a worksheet from a PDF file.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => {
                      return (
                      <FormItem>
                          <FormLabel>Upload PDF File</FormLabel>
                            <FormControl>
                            <div className="relative">
                                <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                type="file"
                                className="pl-10"
                                accept="application/pdf"
                                onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                />
                            </div>
                          </FormControl>
                          <FormDescription>
                              The AI will analyze the PDF to create the worksheet.
                          </FormDescription>
                            <FormMessage />
                      </FormItem>
                      );
                  }}
                />

                <FormField
                  control={form.control}
                  name="criticality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criticality</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a criticality level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
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
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
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
              <ScrollArea className="h-[600px] w-full">
                <div className="prose dark:prose-invert lg:prose-xl markdown-worksheet p-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {generatedWorksheet}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
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
