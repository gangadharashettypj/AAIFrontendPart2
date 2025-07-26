'use server';

/**
 * @fileOverview A worksheet generation AI agent.
 *
 * - generateWorksheet - A function that handles the worksheet generation process.
 * - GenerateWorksheetInput - The input type for the generateWorksheet function.
 * - GenerateWorksheetOutput - The return type for the generateWorksheet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorksheetInputSchema = z.object({
  topic: z.string().describe("The user's request for a worksheet, which could include topic, grade level, and number of questions."),
  gradeLevel: z.string().describe('The grade level of the worksheet.'),
  fileDataUri: z.string().optional().describe(
    "An optional file (image, audio, or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type GenerateWorksheetInput = z.infer<typeof GenerateWorksheetInputSchema>;

const GenerateWorksheetOutputSchema = z.object({
  worksheet: z.string().describe('The generated worksheet content in markdown format.'),
});
export type GenerateWorksheetOutput = z.infer<typeof GenerateWorksheetOutputSchema>;

export async function generateWorksheet(input: GenerateWorksheetInput): Promise<GenerateWorksheetOutput> {
  return generateWorksheetFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateWorksheetPrompt',
  input: {schema: GenerateWorksheetInputSchema},
  output: {schema: GenerateWorksheetOutputSchema},
  prompt: `You are an expert teacher specializing in creating worksheets for students. Analyze the user's request to determine the topic, grade level, and number of questions.
  
  If a file is provided, analyze its content to determine the topic. The user's text topic might just say 'analyze file'.

  Then, generate the worksheet content in markdown format.

User Request: {{{topic}}}
Grade Level: {{{gradeLevel}}}
{{#if fileDataUri}}
File for analysis: {{media url=fileDataUri}}
{{/if}}
`,
});

const generateWorksheetFlow = ai.defineFlow(
  {
    name: 'generateWorksheetFlow',
    inputSchema: GenerateWorksheetInputSchema,
    outputSchema: GenerateWorksheetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
