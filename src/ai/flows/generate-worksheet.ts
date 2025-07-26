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
  query: z.string().describe('The user\'s request for a worksheet, which could include topic, grade level, and number of questions.'),
});
export type GenerateWorksheetInput = z.infer<typeof GenerateWorksheetInputSchema>;

const GenerateWorksheetOutputSchema = z.object({
  worksheet: z.string().describe('The generated worksheet content.'),
});
export type GenerateWorksheetOutput = z.infer<typeof GenerateWorksheetOutputSchema>;

export async function generateWorksheet(input: GenerateWorksheetInput): Promise<GenerateWorksheetOutput> {
  return generateWorksheetFlow(input);
}

const worksheetTool = ai.defineTool(
    {
      name: 'createWorksheet',
      description: 'Creates a worksheet based on a topic, grade level, and number of questions.',
      inputSchema: z.object({
        topic: z.string(),
        gradeLevel: z.string(),
        numberOfQuestions: z.number(),
      }),
      outputSchema: z.string(),
    },
    async ({topic, gradeLevel, numberOfQuestions}) => {
      return `Please generate a worksheet with ${numberOfQuestions} questions about ${topic} for ${gradeLevel}.`;
    }
  );


const prompt = ai.definePrompt({
  name: 'generateWorksheetPrompt',
  input: {schema: GenerateWorksheetInputSchema},
  output: {schema: GenerateWorksheetOutputSchema},
  tools: [worksheetTool],
  prompt: `You are an expert teacher specializing in creating worksheets for students. Analyze the user's request to determine the topic, grade level, and number of questions. Then, use the provided tool to generate the worksheet.

User Request: {{{query}}}`,
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
