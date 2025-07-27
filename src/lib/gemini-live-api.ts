export class GeminiLiveResponseMessage {
  data: string;
  type: "SETUP COMPLETE" | "TEXT" | "AUDIO" | "UNKNOWN";
  endOfTurn: boolean;

  constructor(data: any) {
    this.data = "";
    this.type = "UNKNOWN";
    this.endOfTurn = data?.serverContent?.turnComplete;

    const parts = data?.serverContent?.modelTurn?.parts;

    if (data?.setupComplete) {
      this.type = "SETUP COMPLETE";
    } else if (parts?.length && parts[0].text) {
      this.data = parts[0].text;
      this.type = "TEXT";
    } else if (parts?.length && parts[0].inlineData) {
      this.data = parts[0].inlineData.data;
      this.type = "AUDIO";
    }
  }
}

export class GeminiLiveAPI {
  proxyUrl: string;
  projectId: string;
  model: string;
  modelUri: string;
  responseModalities: Array<"AUDIO" | "TEXT">;
  systemInstructions: string;
  apiHost: string;
  serviceUrl: string;
  onReceiveResponse: (message: GeminiLiveResponseMessage) => void;
  onConnectionStarted: () => void;
  onErrorMessage: (message: string) => void;
  accessToken: string;
  webSocket: WebSocket | null;

  constructor(
    proxyUrl: string,
    projectId: string,
    model: string,
    apiHost: string
  ) {
    this.proxyUrl = proxyUrl;

    this.projectId = projectId;
    this.model = model;
    this.modelUri = `projects/${this.projectId}/locations/us-central1/publishers/google/models/${this.model}`;

    this.responseModalities = ["AUDIO"];
    this.systemInstructions = "";

    this.apiHost = apiHost;
    this.serviceUrl = `wss://${this.apiHost}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;

    this.onReceiveResponse = (message) => {
      console.log("Default message received callback", message);
    };

    this.onConnectionStarted = () => {
      console.log("Default onConnectionStarted");
    };

    this.onErrorMessage = (message) => {
      alert(message);
    };

    this.accessToken = "";
    this.webSocket = null;

    console.log("Created Gemini Live API object: ", this);
  }

  setProjectId(projectId: string) {
    this.projectId = projectId;
    this.modelUri = `projects/${this.projectId}/locations/us-central1/publishers/google/models/${this.model}`;
  }

  setAccessToken(newAccessToken: string) {
    console.log("setting access token: ", newAccessToken);
    this.accessToken = newAccessToken;
  }

  connect(accessToken: string) {
    this.setAccessToken(accessToken);
    this.setupWebSocketToService();
  }

  disconnect() {
    this.webSocket?.close();
  }

  sendMessage(message: object) {
    this.webSocket?.send(JSON.stringify(message));
  }

  onReceiveMessage(messageEvent: MessageEvent) {
    const messageData = JSON.parse(messageEvent.data);
    const message = new GeminiLiveResponseMessage(messageData);
    this.onReceiveResponse(message);
  }

  setupWebSocketToService() {
    console.log("connecting: ", this.proxyUrl);

    try {
      this.webSocket = new WebSocket(this.proxyUrl);
    } catch (e) {
      console.error("websocket error: ", e);
      this.onErrorMessage("Connection error");
      return;
    }

    this.webSocket.onclose = (event) => {
      console.log("websocket closed: ", event);
      if (event.code !== 1000) {
        this.onErrorMessage(`Connection closed: ${event.reason}`);
      }
    };

    this.webSocket.onerror = (event) => {
      console.log("websocket error: ", event);
      this.onErrorMessage("Connection error");
    };

    this.webSocket.onopen = (event) => {
      console.log("websocket open: ", event);
      this.sendInitialSetupMessages();
      this.onConnectionStarted();
    };

    this.webSocket.onmessage = this.onReceiveMessage.bind(this);
  }

  sendInitialSetupMessages() {
    const serviceSetupMessage = {
      bearer_token: this.accessToken,
      service_url: this.serviceUrl,
    };
    this.sendMessage(serviceSetupMessage);

    const sessionSetupMessage = {
      setup: {
        model: this.modelUri,
        generation_config: {
          response_modalities: this.responseModalities,
          //   proactivity: {
          //   proactive_audio: true,
          //   },
        },
        system_instruction: {
          parts: [{ text: this.systemInstructions }],
        },
      },
    };
    this.sendMessage(sessionSetupMessage);
  }

  sendTextMessage(text: string) {
    const textMessage = {
      client_content: {
        turns: [
          {
            role: "user",
            parts: [{ text: text }],
          },
        ],
        turn_complete: true,
      },
    };
    this.sendMessage(textMessage);
  }

  sendRealtimeInputMessage(data: string, mime_type: string) {
    const message = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: mime_type,
            data: data,
          },
        ],
      },
    };
    this.sendMessage(message);
  }

  sendAudioMessage(base64PCM: string) {
    this.sendRealtimeInputMessage(base64PCM, "audio/pcm");
  }

  sendImageMessage(base64Image: string, mime_type: string = "image/jpeg") {
    this.sendRealtimeInputMessage(base64Image, mime_type);
  }
}
