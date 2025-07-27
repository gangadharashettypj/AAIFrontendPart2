import { useAgentManager } from "@/hooks/useAgentManager";
import { ChatMode, ConnectionState, Message } from "@d-id/client-sdk";

import { useEffect, useRef, useState } from "react";

const AvatarView = () => {
  const [warmup, setWarmup] = useState(true);
  const [text, setText] = useState(
    "Ben bobobobo sagi mamamama . bla raga ode ovem. lol cha cha cha cha cha . bobobobo. cha cha cha cha. bobobobo cha cha cha cha bobobobo. ssssssss cha cha cha cha cha bobobobo . cha cha cha cha bobobobo . cha cha cha cha. bobobobo ssssssss"
  );
  const [mode, setMode] = useState<ChatMode>(ChatMode.Functional);
  const [sessionTimeout, setSessionTimeout] = useState<number | undefined>();
  const [compatibilityMode, setCompatibilityMode] = useState<
    "on" | "off" | "auto"
  >();
  const [fluent, setFluent] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const nodeEnv = "prod";
  const didApiUrl = "https://api.d-id.com";
  const didSocketApiUrl = "wss://notifications.d-id.com";
  const agentId = "v2_agt_KCm-2Vmm";
  const clientKey =
    "Z29vZ2xlLW9hdXRoMnwxMDE2MDE2MTMzODUzNTI2NTA4OTk6aFFTek04Y3FscHFWLUNTMkwwblhp";

  const {
    srcObject,
    connectionState,
    messages,
    isSpeaking,
    connect,
    disconnect,
    speak,
    chat,
    interrupt,
  } = useAgentManager({
    agentId,
    baseURL: didApiUrl,
    wsURL: didSocketApiUrl,
    mode,
    enableAnalytics: false,
    auth: { type: "key", clientKey },
    streamOptions: {
      streamWarmup: warmup,
      sessionTimeout,
      compatibilityMode,
      fluent,
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
    <div id="app">
      <section>
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
            <button
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
            </button>

            <button
              onClick={() => chat(text)}
              disabled={
                isSpeaking || connectionState !== ConnectionState.Connected
              }
            >
              Send to Chat
            </button>

            <button
              onClick={interrupt}
              disabled={
                connectionState !== ConnectionState.Connected || !fluent
              }
            >
              Interrupt
            </button>

            <button
              onClick={disconnect}
              disabled={connectionState !== ConnectionState.Connected}
            >
              Close Connection
            </button>

            <div className="input-options">
              <label>
                <input
                  type="checkbox"
                  name="warmup"
                  checked={warmup}
                  onChange={(e) => setWarmup(e.currentTarget.checked)}
                />
                Warmup
              </label>

              <label>
                <input
                  type="checkbox"
                  name="fluent"
                  checked={fluent}
                  onChange={(e) => setFluent(e.currentTarget.checked)}
                />
                Fluent
              </label>
            </div>
          </fieldset>
        </div>
      </section>
      <footer>
        <video
          ref={videoRef}
          id="main-video"
          autoPlay
          playsInline
          className={
            connectionState === ConnectionState.Connecting ? "animated" : ""
          }
        />
        <div id="options">
          <input
            type="text"
            placeholder="Session Timeout"
            value={sessionTimeout}
            onChange={(e) =>
              setSessionTimeout(parseInt(e.currentTarget.value) || undefined)
            }
          />
          <input
            type="text"
            value={compatibilityMode}
            placeholder="Compatibility Mode (on | off | auto)"
            onChange={(e) =>
              setCompatibilityMode(
                e.currentTarget.value as "on" | "off" | "auto"
              )
            }
          />
          <select
            value={mode}
            onChange={(e) => setMode(e.currentTarget.value as ChatMode)}
          >
            <option value={ChatMode.Functional}>{ChatMode.Functional}</option>
            <option value={ChatMode.Playground}>{ChatMode.Playground}</option>
            <option value={ChatMode.TextOnly}>{ChatMode.TextOnly}</option>
            <option value={ChatMode.Maintenance}>{ChatMode.Maintenance}</option>
            <option value={ChatMode.DirectPlayback}>
              {ChatMode.DirectPlayback}
            </option>
          </select>
        </div>
        {messages.length > 0 && (
          <pre>
            {JSON.stringify(
              messages.map((m: Message) => [m.role, m.content].join(": ")),
              null,
              4
            )}
          </pre>
        )}
      </footer>
    </div>
  );
};

export default AvatarView;
