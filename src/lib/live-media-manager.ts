export class LiveAudioOutputManager {
    audioInputContext?: AudioContext;
    workletNode?: AudioWorkletNode;
    initialized: boolean = false;
    audioQueue: Float32Array[] = [];
    isPlaying: boolean = false;

    constructor() {
        this.initializeAudioContext();
    }

    async playAudioChunk(base64AudioChunk: string) {
        try {
            if (!this.initialized) {
                await this.initializeAudioContext();
            }

            if (this.audioInputContext?.state === "suspended") {
                await this.audioInputContext.resume();
            }

            const arrayBuffer = LiveAudioOutputManager.base64ToArrayBuffer(base64AudioChunk);
            const float32Data = LiveAudioOutputManager.convertPCM16LEToFloat32(arrayBuffer);

            this.workletNode?.port.postMessage(float32Data);
        } catch (error) {
            console.error("Error processing audio chunk:", error);
        }
    }

    async initializeAudioContext() {
        if (this.initialized || typeof window === 'undefined') return;

        try {
            this.audioInputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            await this.audioInputContext.audioWorklet.addModule("/pcm-processor.js");
            this.workletNode = new AudioWorkletNode(this.audioInputContext, "pcm-processor");
            this.workletNode.connect(this.audioInputContext.destination);
            this.initialized = true;
        } catch (e) {
            console.error('Failed to initialize audio context', e)
        }
    }

    static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    static convertPCM16LEToFloat32(pcmData: ArrayBuffer): Float32Array {
        const inputArray = new Int16Array(pcmData);
        const float32Array = new Float32Array(inputArray.length);
        for (let i = 0; i < inputArray.length; i++) {
            float32Array[i] = inputArray[i] / 32768;
        }
        return float32Array;
    }
}


export class LiveAudioInputManager {
    audioContext?: AudioContext;
    processor?: ScriptProcessorNode;
    pcmData: number[] = [];
    deviceId: string | null = null;
    interval: NodeJS.Timeout | null = null;
    stream?: MediaStream;
    onNewAudioRecordingChunk: (audioData: string) => void = () => {};

    async connectMicrophone() {
        if (typeof window === 'undefined') return;
        this.audioContext = new AudioContext({ sampleRate: 16000 });

        let constraints: MediaStreamConstraints = {
            audio: {
                channelCount: 1,
                sampleRate: 16000,
            },
        };

        if (this.deviceId) {
            (constraints.audio as MediaTrackConstraints).deviceId = { exact: this.deviceId };
        }

        this.stream = await navigator.mediaDevices.getUserMedia(constraints);

        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = inputData[i] * 0x7fff;
            }
            this.pcmData.push(...Array.from(pcm16));
        };

        source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);

        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(this.recordChunk.bind(this), 1000);
    }

    newAudioRecording(b64AudioData: string) {
        this.onNewAudioRecordingChunk(b64AudioData);
    }

    recordChunk() {
        if (this.pcmData.length === 0) return;
        const buffer = new ArrayBuffer(this.pcmData.length * 2);
        const view = new DataView(buffer);
        this.pcmData.forEach((value, index) => {
            view.setInt16(index * 2, value, true);
        });

        const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer) as any));
        this.newAudioRecording(base64);
        this.pcmData = [];
    }

    disconnectMicrophone() {
        try {
            this.processor?.disconnect();
            this.audioContext?.close();
        } catch(e) {
            console.error("Error disconnecting microphone", e);
        }

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.stream?.getTracks().forEach(track => track.stop());
    }

    async updateMicrophoneDevice(deviceId: string) {
        const wasConnected = !!this.stream;
        this.deviceId = deviceId;
        this.disconnectMicrophone();
        if(wasConnected){
            await this.connectMicrophone();
        }
    }
}

export class LiveVideoManager {
    previewVideoElement: HTMLVideoElement;
    previewCanvasElement: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    stream: MediaStream | null = null;
    interval: NodeJS.Timeout | null = null;
    onNewFrame: (newFrame: string) => void = () => {};

    constructor(previewVideoElement: HTMLVideoElement, previewCanvasElement: HTMLCanvasElement) {
        this.previewVideoElement = previewVideoElement;
        this.previewCanvasElement = previewCanvasElement;
        this.ctx = this.previewCanvasElement.getContext("2d");
    }

    async startWebcam(deviceId?: string) {
        if(typeof navigator === 'undefined' || !navigator.mediaDevices) return;
        try {
            const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true };
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.previewVideoElement.srcObject = this.stream;
        } catch (err) {
            console.error("Error accessing the webcam: ", err);
        }

        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(this.newFrame.bind(this), 1000);
    }

    stopWebcam() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.stopStream();
    }

    stopStream() {
        if (!this.stream) return;
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.previewVideoElement.srcObject = null;
    }

    async updateWebcamDevice(deviceId: string) {
        this.stopStream();
        await this.startWebcam(deviceId);
    }

    captureFrameB64(): string {
        if (this.stream == null || !this.ctx || this.previewVideoElement.videoWidth === 0) return "";
        this.previewCanvasElement.width = this.previewVideoElement.videoWidth;
        this.previewCanvasElement.height = this.previewVideoElement.videoHeight;
        this.ctx.drawImage(this.previewVideoElement, 0, 0, this.previewCanvasElement.width, this.previewCanvasElement.height);
        return this.previewCanvasElement.toDataURL("image/jpeg").split(",")[1].trim();
    }

    newFrame() {
        const frameData = this.captureFrameB64();
        if(frameData) this.onNewFrame(frameData);
    }
}

export class LiveScreenManager {
    previewVideoElement: HTMLVideoElement;
    previewCanvasElement: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    stream: MediaStream | null = null;
    interval: NodeJS.Timeout | null = null;
    onNewFrame: (newFrame: string) => void = () => {};

    constructor(previewVideoElement: HTMLVideoElement, previewCanvasElement: HTMLCanvasElement) {
        this.previewVideoElement = previewVideoElement;
        this.previewCanvasElement = previewCanvasElement;
        this.ctx = this.previewCanvasElement.getContext("2d");
    }

    async startCapture() {
        if(typeof navigator === 'undefined' || !navigator.mediaDevices) return;
        try {
            this.stream = await navigator.mediaDevices.getDisplayMedia({video: true});
            this.previewVideoElement.srcObject = this.stream;
        } catch (err) {
            console.error("Error accessing the screen: ", err);
        }
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(this.newFrame.bind(this), 1000);
    }

    stopCapture() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (!this.stream) return;
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.previewVideoElement.srcObject = null;
    }

    captureFrameB64(): string {
        if (this.stream == null || !this.ctx || this.previewVideoElement.videoWidth === 0) return "";
        this.previewCanvasElement.width = this.previewVideoElement.videoWidth;
        this.previewCanvasElement.height = this.previewVideoElement.videoHeight;
        this.ctx.drawImage(this.previewVideoElement, 0, 0, this.previewCanvasElement.width, this.previewCanvasElement.height);
        return this.previewCanvasElement.toDataURL("image/jpeg").split(",")[1].trim();
    }

    newFrame() {
        const frameData = this.captureFrameB64();
        if(frameData) this.onNewFrame(frameData);
    }
}
