import WebSocket from 'ws';
import { CARTESIA_CONFIG } from './config.js';
import type {
  TTSChunkResponse,
  TTSDoneResponse,
  TTSRequest,
  TTSResponse,
  TTSConfig,
  TTSAudioCallback,
  TTSDoneCallback,
  TTSErrorCallback,
  TTSErrorResponse,
} from './types.js';

/**
 * Cartesia TTS WebSocket Client
 * cArTeSiA dOcS.md: continuations (context_id, continue:true/false), max_buffer_delay_ms 0 for streaming.
 * cArTeSiA wEbSoCkEt.md: research https://docs.cartesia.ai/api-reference/tts/websocket for issues/fixes.
 */
export class CartesiaTTSClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
  private _disconnecting = false;
  private contextConfigs = new Map<string, Partial<TTSConfig>>();
  private activeContexts = new Set<string>();
  
  // Callbacks
  private onAudioCallback?: TTSAudioCallback;
  private onDoneCallback?: TTSDoneCallback;
  private onErrorCallback?: TTSErrorCallback;
  
  // Performance tracking
  private contextStartTimes = new Map<string, number>();
  private firstByteTimes = new Map<string, number>();

  constructor(
    private apiKey: string = CARTESIA_CONFIG.API_KEY,
    private voiceId: string = CARTESIA_CONFIG.VOICE_ID,
    private model: string = CARTESIA_CONFIG.TTS.MODEL
  ) {}

  /**
   * Connect to Cartesia TTS WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(CARTESIA_CONFIG.TTS.ENDPOINT);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('cartesia_version', CARTESIA_CONFIG.API_VERSION);

      this.ws = new WebSocket(url.toString());

      this.ws.on('open', () => {
        console.log('[TTS] Connected to Cartesia TTS WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error('[TTS] WebSocket error:', error);
        this.isConnected = false;
        if (this.onErrorCallback) {
          this.onErrorCallback(error.message, '');
        }
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('[TTS] WebSocket closed');
        this.isConnected = false;
        if (!this._disconnecting) this.attemptReconnect();
      });
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as TTSResponse;
      
      switch (message.type) {
        case 'chunk':
          this.handleAudioChunk(message as TTSChunkResponse);
          break;
        case 'flush_done':
          console.log('[TTS] Flush done for context:', message.context_id);
          break;
        case 'done':
          this.handleDone(message as TTSDoneResponse);
          break;
        case 'timestamps':
          // Word timestamps available if needed
          break;
        default:
          if ('error' in message) {
            this.handleError(message as TTSErrorResponse);
          }
      }
    } catch (error) {
      console.error('[TTS] Error parsing message:', error);
    }
  }

  /**
   * Handle audio chunk response
   */
  private handleAudioChunk(response: TTSChunkResponse): void {
    const { data: base64Data, context_id } = response;
    
    // Track first byte latency
    if (!this.firstByteTimes.has(context_id)) {
      const startTime = this.contextStartTimes.get(context_id);
      if (startTime) {
        const latency = Date.now() - startTime;
        this.firstByteTimes.set(context_id, latency);
        console.log(`[TTS] First byte latency for ${context_id}: ${latency}ms`);
      }
    }
    
    // Decode base64 audio data
    const audioBuffer = Buffer.from(base64Data, 'base64');
    
    if (this.onAudioCallback) {
      this.onAudioCallback(audioBuffer.buffer, context_id);
    }
  }

  /**
   * Handle done response
   */
  private handleDone(response: TTSDoneResponse): void {
    const { context_id } = response;
    this.activeContexts.delete(context_id);
    
    // Clean up after 1 second (context expiration)
    setTimeout(() => {
      this.contextConfigs.delete(context_id);
      this.contextStartTimes.delete(context_id);
      this.firstByteTimes.delete(context_id);
    }, 1000);
    
    if (this.onDoneCallback) {
      this.onDoneCallback(context_id);
    }
  }

  /**
   * Handle error response
   */
  private handleError(response: TTSResponse & { error: string }): void {
    const { error, context_id } = response;
    console.error(`[TTS] Error for context ${context_id}:`, error);
    
    if (this.onErrorCallback) {
      this.onErrorCallback(error, context_id);
    }
  }

  /**
   * Send text for speech generation
   */
  sendText(
    transcript: string,
    contextId: string,
    isContinue: boolean = false
  ): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('TTS WebSocket not connected');
    }

    // Get or create context configuration
    let config = this.contextConfigs.get(contextId);
    
    if (!config) {
      // First message for this context — cArTeSiA dOcS: raw, pcm_s16le 8kHz, max_buffer_delay_ms 0 for streaming
      config = {
        model_id: this.model,
        voice: {
          mode: 'id',
          id: this.voiceId,
        },
        language: CARTESIA_CONFIG.TTS.LANGUAGE,
        context_id: contextId,
        output_format: {
          container: 'raw',
          encoding: CARTESIA_CONFIG.TTS.ENCODING,
          sample_rate: CARTESIA_CONFIG.TTS.SAMPLE_RATE,
        },
        add_timestamps: true,
        max_buffer_delay_ms: CARTESIA_CONFIG.TTS.MAX_BUFFER_DELAY_MS,
      };
      this.contextConfigs.set(contextId, config);
      this.contextStartTimes.set(contextId, Date.now());
      this.activeContexts.add(contextId);
    }

    // Create request with transcript and continue flag
    const request: TTSRequest = {
      ...config,
      transcript,
      continue: isContinue,
    };

    this.ws.send(JSON.stringify(request));
  }

  /**
   * Stream multiple text chunks with continuations
   */
  streamTextChunks(
    chunks: string[],
    contextId: string
  ): void {
    chunks.forEach((chunk, index) => {
      const isContinue = index < chunks.length - 1;
      this.sendText(chunk, contextId, isContinue);
    });
  }

  /**
   * Cancel a context
   */
  cancelContext(contextId: string): void {
    if (!this.isConnected || !this.ws) {
      return;
    }

    const cancelMessage = {
      context_id: contextId,
      cancel: true,
    };

    this.ws.send(JSON.stringify(cancelMessage));
    this.activeContexts.delete(contextId);
  }

  /**
   * Set audio callback
   */
  onAudio(callback: TTSAudioCallback): void {
    this.onAudioCallback = callback;
  }

  /**
   * Set done callback
   */
  onDone(callback: TTSDoneCallback): void {
    this.onDoneCallback = callback;
  }

  /**
   * Set error callback
   */
  onError(callback: TTSErrorCallback): void {
    this.onErrorCallback = callback;
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= CARTESIA_CONFIG.WS.MAX_RECONNECT_ATTEMPTS) {
      console.error('[TTS] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = CARTESIA_CONFIG.WS.RECONNECT_DELAY * this.reconnectAttempts;
    
    console.log(`[TTS] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimerId = setTimeout(() => {
      this.reconnectTimerId = null;
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Get first byte latency for a context
   */
  getFirstByteLatency(contextId: string): number | undefined {
    return this.firstByteTimes.get(contextId);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this._disconnecting = true;
    if (this.reconnectTimerId !== null) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._disconnecting = false;
    this.isConnected = false;
    this.contextConfigs.clear();
    this.activeContexts.clear();
    this.contextStartTimes.clear();
    this.firstByteTimes.clear();
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}
