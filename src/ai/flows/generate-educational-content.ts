'use server';

/**
 * @fileOverview Educational content generation flow.
 *
 * - generateEducationalContent - A function that generates educational content from a topic, grade level, and optional file.
 * - GenerateEducationalContentInput - The input type for the generateEducationalContent function.
 * - GenerateEducationalContentOutput - The return type for the generateEducationalContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEducationalContentInputSchema = z.object({
  topic: z.string().describe('The topic of the lesson plan. Could be "Analyzing file contents..." if a file is provided.'),
  gradeLevel: z.string().describe('The grade level of the lesson plan.'),
  fileDataUri: z.string().optional().describe(
    "An optional file (image, audio, or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type GenerateEducationalContentInput = z.infer<typeof GenerateEducationalContentInputSchema>;

const GenerateEducationalContentOutputSchema = z.object({
  educationalContent: z.string().describe('The generated educational content in markdown format.'),
});
export type GenerateEducationalContentOutput = z.infer<typeof GenerateEducationalContentOutputSchema>;

export async function generateEducationalContent(input: GenerateEducationalContentInput): Promise<GenerateEducationalContentOutput> {
  return generateEducationalContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEducationalContentPrompt',
  input: {schema: GenerateEducationalContentInputSchema},
  output: {schema: GenerateEducationalContentOutputSchema},
  prompt: `You are an advanced AI Content Generator with the ability to analyze diverse input formats and produce detailed educational content. Your task is to extract the primary topic from the provided text, image, PDF, or audio input and then generate comprehensive, well-structured educational material on that topic. The generated content should be suitable for download. Here's how you should operate:

Analyze Input:

Thoroughly examine the provided input (text, image, PDF, or audio).

Identify the core subject and specific topic being presented or discussed. If multiple topics are present, identify the most prominent one.

For images, describe what's depicted and its relevance to the topic.

For PDFs, identify key sections, headings, and central themes.

For audio, transcribe relevant parts if necessary and summarize the main points.

Generate Detailed Content (Concise):

Based on the identified topic, generate comprehensive educational content.

Structure: Organize the content logically using markdown headings (##), subheadings (###), and bullet points or numbered lists where appropriate.

Depth & Conciseness: Provide essential explanations, definitions, examples, and relevant facts. Aim for sufficient depth to be valuable for someone learning about the topic, but keep explanations direct and to the point, avoiding unnecessary verbosity.

Clarity: Use clear, concise language. Explain any complex terminology briefly.

Engagement: While informative, aim for an engaging tone.

Key Elements to Include (where applicable to the topic):

Introduction: A brief overview of the topic.

Key Concepts/Definitions: Essential terms and their meanings.

Explanations: Direct descriptions of processes, theories, or historical events.

Formulas/Equations (for STEM topics): Properly formatted equations with brief explanations if required.

Diagram/Visual Descriptions: If the original input was an image or if a concept would benefit from a visual, describe what such a visual would depict succinctly.

Summary/Conclusion: A brief recap of the main points.

Prepare for Download:

Format the entire generated content as a single, cohesive block of text using markdown.

Do NOT include any conversational filler or extra dialogue outside of the content itself.

The output should be ready to be directly saved as a .txt, .md, or easily convertible to .pdf.

topic: {{{topic}}}
{{#if fileDataUri}}
File: {{media url=fileDataUri}}
{{/if}}
class : {{{gradeLevel}}}
`,
});

const generateEducationalContentFlow = ai.defineFlow(
  {
    name: 'generateEducationalContentFlow',
    inputSchema: GenerateEducationalContentInputSchema,
    outputSchema: GenerateEducationalContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
