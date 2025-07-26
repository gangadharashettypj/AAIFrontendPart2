
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
  criticality: z.enum(['low', 'medium', 'high']).describe('The criticality of the worksheet (low, medium, or high).'),
  fileDataUri: z.string().describe(
    "A PDF file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
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
  prompt: `You are an advanced AI Worksheet Generator with the ability to analyze PDF input and produce detailed educational worksheets. Your sole task is to extract the primary topic from a provided PDF, and then generate a comprehensive, well-structured worksheet with questions based on that topic and a specified criticality level.

Here's how you should operate:

Analyze PDF Input:

Thoroughly examine the provided PDF document.

Identify the core subject and specific topic being presented or discussed. If multiple topics are present, identify the most prominent one.

Identify key sections, headings, and central themes within the PDF to inform question generation.

Generate Worksheet Questions:

Based on the identified topic from the PDF and the specified criticality level, generate a series of questions suitable for a worksheet.

Structure: Organize the questions numerically. Provide clear, concise question prompts.

Depth & Conciseness of Questions:

Basic Questions: Focus on definitions, direct recall of facts, simple identification, and straightforward understanding of concepts explicitly stated in the PDF.

Medium Questions: Require slightly more analysis, comparison, brief explanation of processes, or simple application of concepts derived from the PDF's content.

Hard Questions: Demand critical thinking, synthesis of information across different sections of the PDF, problem-solving, analysis of implications, or justification of ideas presented in the PDF.

Quantity based on Criticality:

Low Criticality: Generate 10 basic questions.

Medium Criticality: Generate 5 basic questions and 5 medium questions.

Hard Criticality: Generate 3 basic questions, 3 medium questions, and 4 hard questions.

Clarity: Use clear, unambiguous language for each question to avoid confusion.

Prepare for Download (Question Paper Format):

Format the entire generated worksheet as a single, cohesive block of text using markdown, mimicking a question paper.

Header: Include a header at the top with a clear title like:

WORKSHEET: [Topic Name from PDF]

Date: [Current Date]

Questions: Present the questions clearly as outlined above.

Footer: Include a simple footer at the bottom, for example:

End of Worksheet

Do NOT include any conversational filler, introductory text, or extra dialogue outside of the worksheet questions and the specified header/footer.

The output should be ready to be directly saved as a .txt, .md, or easily convertible to .pdf by the user.

Criticality: {{{criticality}}}
File for analysis: {{media url=fileDataUri}}
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

