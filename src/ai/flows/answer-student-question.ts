'use server';

/**
 * @fileOverview A flow to answer student questions using AI.
 *
 * - answerStudentQuestion - A function that answers a student's question.
 * - AnswerStudentQuestionInput - The input type for the answerStudentQuestion function.
 * - AnswerStudentQuestionOutput - The return type for the answerStudentQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerStudentQuestionInputSchema = z.object({
  question: z.string().describe('The question the student asked.'),
  context: z.string().describe('Contextual information relevant to the question.'),
});
export type AnswerStudentQuestionInput = z.infer<typeof AnswerStudentQuestionInputSchema>;

const AnswerStudentQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the student question.'),
});
export type AnswerStudentQuestionOutput = z.infer<typeof AnswerStudentQuestionOutputSchema>;

export async function answerStudentQuestion(input: AnswerStudentQuestionInput): Promise<AnswerStudentQuestionOutput> {
  return answerStudentQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerStudentQuestionPrompt',
  input: {schema: AnswerStudentQuestionInputSchema},
  output: {schema: AnswerStudentQuestionOutputSchema},
  prompt: `You are a helpful AI assistant for teachers.

  Your task is to answer student questions based on the provided context.

  Context: {{{context}}}

  Question: {{{question}}}

  Answer:`,
});

const answerStudentQuestionFlow = ai.defineFlow(
  {
    name: 'answerStudentQuestionFlow',
    inputSchema: AnswerStudentQuestionInputSchema,
    outputSchema: AnswerStudentQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
