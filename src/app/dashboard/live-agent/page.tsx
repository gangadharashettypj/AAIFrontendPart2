import { LiveAgent } from "@/components/live-agent";

export default function LiveAgentPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Multimodal Live API
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          The Multimodal Live API enables low-latency, two-way interactions that
          use text, audio, and video input, with audio and text output.
        </p>
      </div>
      <LiveAgent />
    </main>
  );
}
