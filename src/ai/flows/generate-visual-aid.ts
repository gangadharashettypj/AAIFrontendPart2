'use server';

/**
 * @fileOverview Visual aid generation for teachers.
 *
 * - generateVisualAid - A function that handles the visual aid generation process.
 * - GenerateVisualAidInput - The input type for the generateVisualAid function.
 * - GenerateVisualAidOutput - The return type for the generateVisualAid function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVisualAidInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate a visual aid.'),
  type: z
    .enum(['image', 'video'])
    .describe('The type of visual aid to generate (image or video).'),
});
export type GenerateVisualAidInput = z.infer<typeof GenerateVisualAidInputSchema>;

const GenerateVisualAidOutputSchema = z.object({
  visualAid: z.string().describe('The generated visual aid as a data URI.'),
});
export type GenerateVisualAidOutput = z.infer<typeof GenerateVisualAidOutputSchema>;

export async function generateVisualAid(input: GenerateVisualAidInput): Promise<GenerateVisualAidOutput> {
  return generateVisualAidFlow(input);
}

const generateVisualAidPrompt = ai.definePrompt({
  name: 'generateVisualAidPrompt',
  input: {schema: GenerateVisualAidInputSchema},
  output: {schema: GenerateVisualAidOutputSchema},
  prompt: `You are an AI assistant that generates visual aids for teachers.

  The teacher is requesting a visual aid for the following topic: {{{topic}}}.
  The teacher has specified that the visual aid should be of type: {{{type}}}.

  If the type is "image", then generate an image URL of the topic.
  If the type is "video", then generate a video of the topic.
  Make sure the URL is a data URI.

  Ensure that the generated visual aid is appropriate for educational purposes and enhances student understanding.
  `,
});

const generateVisualAidFlow = ai.defineFlow(
  {
    name: 'generateVisualAidFlow',
    inputSchema: GenerateVisualAidInputSchema,
    outputSchema: GenerateVisualAidOutputSchema,
  },
  async input => {
    if (input.type === 'image') {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate an image of ${input.topic}`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('Failed to generate image.');
      }

      return {visualAid: media.url};
    } else if (input.type === 'video') {
      let {operation} = await ai.generate({
        model: 'googleai/veo-2.0-generate-001',
        prompt: `Generate a video of ${input.topic}`,
        config: {
          durationSeconds: 5,
          aspectRatio: '16:9',
        },
      });

      if (!operation) {
        throw new Error('Expected the model to return an operation');
      }

      // Wait until the operation completes. Note that this may take some time, maybe even up to a minute. Design the UI accordingly.
      while (!operation.done) {
        operation = await ai.checkOperation(operation);
        // Sleep for 5 seconds before checking again.
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      if (operation.error) {
        throw new Error('failed to generate video: ' + operation.error.message);
      }

      const video = operation.output?.message?.content.find(p => !!p.media);
      if (!video) {
        throw new Error('Failed to find the generated video');
      }

      // const fetch = (await import('node-fetch')).default;
      // Add API key before fetching the video.
      // const videoDownloadResponse = await fetch(
      //   `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
      // );
      // if (
      //   !videoDownloadResponse ||
      //   videoDownloadResponse.status !== 200 ||
      //   !videoDownloadResponse.body
      // ) {
      //   throw new Error('Failed to fetch video');
      // }

      // Readable.from(videoDownloadResponse.body).pipe(fs.createWriteStream(path));

      return {visualAid: video.media.url};
    } else {
      throw new Error(`Unsupported visual aid type: ${input.type}`);
    }
  }
);
