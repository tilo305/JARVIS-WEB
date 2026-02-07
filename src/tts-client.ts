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
  // Keep-alive for connection persistence
  private keepAliveIntervalId: ReturnType<typeof setInterval> | null = null;
  private keepAliveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastPongTime: number = 0;
  
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
    // Prevent multiple simultaneous connection attempts
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) {
      // CONNECTING (0) or OPEN (1)
      if (this.ws.readyState === 1 && this.isConnected) {
        return Promise.resolve(); // Already connected
      }
      // If connecting, wait for it or reject
      return Promise.reject(new Error('TTS WebSocket connection already in progress'));
    }

    return new Promise((resolve, reject) => {
      const url = new URL(CARTESIA_CONFIG.TTS.ENDPOINT);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('cartesia_version', CARTESIA_CONFIG.API_VERSION);

      // Clean up existing connection if any
      if (this.ws) {
        try {
          this.ws.removeAllListeners();
          if (this.ws.readyState !== 3) { // Not CLOSED
            this.ws.close();
          }
        } catch {
          // Ignore cleanup errors
        }
      }

      this.ws = new WebSocket(url.toString());

      const timeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== 1) {
          this.ws.close();
          const err = new Error('TTS WebSocket connection timeout');
          this.isConnected = false;
          reject(err);
        }
      }, CARTESIA_CONFIG.WS.TIMEOUT_MS);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        console.log('[TTS] Connected to Cartesia TTS WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.lastPongTime = Date.now();
        this.startKeepAlive();
        resolve();
      });

      // Handle pong frames for keep-alive (ws library emits 'pong' event)
      this.ws.on('pong', () => {
        this.lastPongTime = Date.now();
        if (this.keepAliveTimeoutId) {
          clearTimeout(this.keepAliveTimeoutId);
          this.keepAliveTimeoutId = null;
        }
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        clearTimeout(timeout);
        console.error('[TTS] WebSocket error:', error);
        this.isConnected = false;
        if (this.onErrorCallback) {
          this.onErrorCallback(error.message || 'TTS WebSocket error', '');
        }
        reject(error);
      });

      this.ws.on('close', (code, reason) => {
        clearTimeout(timeout);
        this.stopKeepAlive();
        console.log('[TTS] WebSocket closed', { code, reason: reason?.toString() });
        this.isConnected = false;
        // Only reconnect if we want to persist connections and not intentionally disconnecting
        if (!this._disconnecting && CARTESIA_CONFIG.WS.PERSIST_CONNECTIONS) {
          this.attemptReconnect();
        }
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
    
    // cArTeSiA dOcS: Contexts automatically expire 1 second after the last audio output
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

    // Check WebSocket readyState before sending
    if (this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      throw new Error(`TTS WebSocket not open (readyState: ${this.ws.readyState})`);
    }

    // Get or create context configuration
    let config = this.contextConfigs.get(contextId);
    
    if (!config) {
      // First message for this context — cArTeSiA dOcS: raw, pcm_s16le, max_buffer_delay_ms 0 for streaming
      // Note: Using 44100 Hz for quality (docs recommend 8000 Hz for optimal latency)
      config = {
        model_id: this.model,
        voice: {
          mode: 'id',
          id: this.voiceId,
        },
        language: CARTESIA_CONFIG.TTS.LANGUAGE,
        context_id: contextId,
        output_format: {
          container: 'raw', // cArTeSiA dOcS: No container overhead
          encoding: CARTESIA_CONFIG.TTS.ENCODING, // pcm_s16le - recommended for best performance
          sample_rate: CARTESIA_CONFIG.TTS.SAMPLE_RATE, // 44100 Hz for quality (8000 Hz for optimal latency)
        },
        add_timestamps: true,
        max_buffer_delay_ms: CARTESIA_CONFIG.TTS.MAX_BUFFER_DELAY_MS, // 0 = no server buffering when streaming client-side
      };
      this.contextConfigs.set(contextId, config);
      this.contextStartTimes.set(contextId, Date.now());
      this.activeContexts.add(contextId);
    }

    // Create request with transcript and continue flag
    // cArTeSiA dOcS: All fields except transcript, continue, and duration must remain identical
    // across requests on the same context_id. We spread config to ensure this.
    const request: TTSRequest = {
      ...config,
      transcript,
      continue: isContinue,
      // Note: duration is not included - it's optional and not part of our config
    };

    this.ws.send(JSON.stringify(request));
  }

  /**
   * Stream multiple text chunks with continuations
   * Optimized for low latency: sends chunks immediately without batching delays
   */
  streamTextChunks(
    chunks: string[],
    contextId: string
  ): void {
    // Send all chunks immediately without waiting - optimal for streaming latency
    // Each chunk is sent synchronously to minimize delay between chunks
    chunks.forEach((chunk, index) => {
      const isContinue = index < chunks.length - 1;
      try {
        this.sendText(chunk, contextId, isContinue);
      } catch (error) {
        console.error(`[TTS] Error sending chunk ${index + 1}/${chunks.length}:`, error);
        // Continue sending remaining chunks even if one fails
      }
    });
  }

  /**
   * Cancel a context
   * cArTeSiA dOcS: Send {"context_id": "...", "cancel": true}
   * Only halts requests that haven't begun generating
   */
  cancelContext(contextId: string): void {
    if (!this.isConnected || !this.ws) {
      return;
    }

    // Check WebSocket readyState before sending
    if (this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      console.warn('[TTS] Cannot cancel context: WebSocket not open (readyState:', this.ws.readyState, ')');
      this.activeContexts.delete(contextId);
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
   * Start keep-alive mechanism to maintain connection
   */
  private startKeepAlive(): void {
    this.stopKeepAlive();
    
    if (!CARTESIA_CONFIG.WS.KEEP_ALIVE_INTERVAL_MS || CARTESIA_CONFIG.WS.KEEP_ALIVE_INTERVAL_MS <= 0) {
      return; // Keep-alive disabled
    }

    this.keepAliveIntervalId = setInterval(() => {
      if (!this.ws || this.ws.readyState !== 1) { // Not OPEN
        this.stopKeepAlive();
        return;
      }

      // Check if we haven't received a pong in too long
      const timeSinceLastPong = Date.now() - this.lastPongTime;
      if (timeSinceLastPong > CARTESIA_CONFIG.WS.KEEP_ALIVE_TIMEOUT_MS * 2) {
        console.warn('[TTS] Keep-alive timeout - connection may be dead');
        this.stopKeepAlive();
        // Don't force reconnect if we're intentionally disconnecting
        if (!this._disconnecting) {
          this.attemptReconnect();
        }
        return;
      }

      // Send ping (WebSocket ping frame - ws library supports this)
      try {
        if (typeof (this.ws as any).ping === 'function') {
          (this.ws as any).ping();
          // Set timeout to detect if pong doesn't arrive within expected time
          if (this.keepAliveTimeoutId) {
            clearTimeout(this.keepAliveTimeoutId);
          }
          const pingTime = Date.now();
          this.keepAliveTimeoutId = setTimeout(() => {
            this.keepAliveTimeoutId = null;
            // Check if pong arrived (lastPongTime should be >= pingTime if pong arrived)
            if (this.lastPongTime < pingTime) {
              console.warn('[TTS] Pong timeout - connection may be dead');
              this.stopKeepAlive();
              if (!this._disconnecting) {
                this.attemptReconnect();
              }
            }
          }, CARTESIA_CONFIG.WS.KEEP_ALIVE_TIMEOUT_MS);
        } else {
          // Fallback: some WebSocket implementations don't expose ping
          // The connection will be kept alive by regular traffic
          this.lastPongTime = Date.now(); // Update on ping send as fallback
        }
      } catch (err) {
        console.error('[TTS] Keep-alive ping failed:', err);
        this.stopKeepAlive();
      }
    }, CARTESIA_CONFIG.WS.KEEP_ALIVE_INTERVAL_MS);
  }

  /**
   * Stop keep-alive mechanism
   */
  private stopKeepAlive(): void {
    if (this.keepAliveIntervalId !== null) {
      clearInterval(this.keepAliveIntervalId);
      this.keepAliveIntervalId = null;
    }
    if (this.keepAliveTimeoutId !== null) {
      clearTimeout(this.keepAliveTimeoutId);
      this.keepAliveTimeoutId = null;
    }
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
    this.stopKeepAlive();
    
    // Clear reconnect timer
    if (this.reconnectTimerId !== null) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
    
    // Close WebSocket properly
    if (this.ws) {
      try {
        // Remove all listeners to prevent reconnection attempts
        this.ws.removeAllListeners();
        
        // Close the connection
        if (this.ws.readyState !== 3) { // Not CLOSED
          this.ws.close();
        }
      } catch (err) {
        console.error('[TTS] Error during disconnect:', err);
      } finally {
        this.ws = null;
      }
    }
    
    // Reset state
    this._disconnecting = false;
    this.isConnected = false;
    this.contextConfigs.clear();
    this.activeContexts.clear();
    this.contextStartTimes.clear();
    this.firstByteTimes.clear();
    this.reconnectAttempts = 0;
    this.lastPongTime = 0;
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected && this.ws?.readyState === 1; // WebSocket.OPEN = 1
  }

  /**
   * Get WebSocket readyState for debugging
   */
  get readyState(): number {
    return this.ws?.readyState ?? 3; // CLOSED = 3
  }

  /**
   * Check if WebSocket is in a valid state for operations
   */
  isReady(): boolean {
    return this.connected && this.ws?.readyState === 1;
  }
}
