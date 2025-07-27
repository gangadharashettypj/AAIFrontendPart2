import { useAgentManager } from "@/hooks/useAgentManager";
import { ChatMode, ConnectionState, Message } from "@d-id/client-sdk";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const AvatarView = () => {
  const [text, setText] = useState(
    "Ben bobobobo sagi mamamama . bla raga ode ovem. lol cha cha cha cha cha . bobobobo. cha cha cha cha. bobobobo cha cha cha cha bobobobo. ssssssss cha cha cha cha cha bobobobo . cha cha cha cha bobobobo . cha cha cha cha. bobobobo ssssssss"
  );
  const [mode, setMode] = useState<ChatMode>(ChatMode.Functional);

  const videoRef = useRef<HTMLVideoElement>(null);

  const nodeEnv = "prod";
  const didApiUrl = "https://api.d-id.com";
  const didSocketApiUrl = "wss://notifications.d-id.com";
  const agentId = "v2_agt_KCm-2Vmm";
  const clientKey =
    "Z29vZ2xlLW9hdXRoMnwxMDE2MDE2MTMzODUzNTI2NTA4OTk6aFFSek04Y3FscHFWLUNTMkwwblhp";

  const {
    srcObject,
    connectionState,
    messages,
    isSpeaking,
    connect,
    disconnect,
    speak,
    chat
  } = useAgentManager({
    agentId,
    baseURL: didApiUrl,
    wsURL: didSocketApiUrl,
    mode,
    enableAnalytics: false,
    auth: { type: "key", clientKey },
    streamOptions: {

    },
  });

  async function onClick() {
    if (
      connectionState === ConnectionState.New ||
      connectionState === ConnectionState.Fail
    ) {
      await connect();
    } else if (connectionState === ConnectionState.Connected && text) {
      await speak(text);
    }
  }

  useEffect(() => {
    if (srcObject && videoRef.current) {
      videoRef.current.srcObject = srcObject;
    }
  }, [srcObject]);

  return (
    < div style={{
      display: 'flex',
      flexDirection: 'column'
    }}>
     <Card className="mb-4">
        <CardContent className="p-4 space-y-4">
          <div id="left">
            <textarea
              // type="text"
              placeholder="Enter text to stream"
              value={text}
              onInput={(e) => setText(e.currentTarget.value)}
            />
          </div>

          <div id="right">
            <fieldset
              id="main-input"
              disabled={connectionState === ConnectionState.Connecting}
            >
              <Button
                onClick={onClick}
                disabled={
                  isSpeaking ||
                  (!text &&
                    ![ConnectionState.New, ConnectionState.Fail].includes(
                      connectionState
                    ))
                }
              >
                {connectionState === ConnectionState.Connected
                  ? "Send"
                  : connectionState === ConnectionState.Connecting
                  ? "Connecting..."
                  : connectionState === ConnectionState.Fail
                  ? "Failed, Try Again"
                  : "Connect"}
              </Button>

              <Button
                onClick={() => chat(text)}
                disabled={
                  isSpeaking || connectionState !== ConnectionState.Connected
                }
              >
                Send to Chat
              </Button>

              <Button
                onClick={disconnect}
                disabled={connectionState !== ConnectionState.Connected}
              >
                Close Connection
              </Button>


            </fieldset>
          </div>
        </CardContent>
      
    
      </Card>
      <main className="flex-1 flex flex-col gap-4">
          <div className="flex-1 relative rounded-lg overflow-hidden bg-muted flex items-center justify-center">
      <div id="app">
      
        <video
          ref={videoRef}
          id="main-video"
          autoPlay
          playsInline
          className={
            connectionState === ConnectionState.Connecting ? "animated" : ""
          }
        />
      
        {/* {messages.length > 0 && (
          <pre>
            {JSON.stringify(
              messages.map((m: Message) => [m.role, m.content].join(": ")),
              null,
              4
            )}
          </pre>
        )} */}
      </div>
      </div>
      </main>
    </div>
  );
};

export default AvatarView;
