import WebSocket from 'ws';
import { CARTESIA_CONFIG } from './config.js';
import type {
  STTDoneResponse,
  STTErrorResponse,
  STTResponse,
  STTTranscriptCallback,
  STTTranscriptResponse,
  STTDoneCallback,
  STTErrorCallback,
} from './types.js';

/**
 * Cartesia STT WebSocket Client
 * cArTeSiA dOcS.md: 100ms chunks, ink-whisper, pcm_s16le 16kHz, process is_final:false immediately.
 * cArTeSiA wEbSoCkEt.md: research https://docs.cartesia.ai/api-reference/tts/websocket for issues/fixes.
 */
export class CartesiaSTTClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isConfigured = false;
  private reconnectAttempts = 0;
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
  private _disconnecting = false;
  private currentRequestId: string | null = null;
  
  // Callbacks
  private onTranscriptCallback?: STTTranscriptCallback;
  private onDoneCallback?: STTDoneCallback;
  private onErrorCallback?: STTErrorCallback;
  
  // Performance tracking
  private requestStartTimes = new Map<string, number>();
  private partialLatencies: number[] = [];
  private finalLatencies: number[] = [];

  constructor(
    private apiKey: string = CARTESIA_CONFIG.API_KEY
  ) {}

  /**
   * Connect to Cartesia STT WebSocket
   * cArTeSiA dOcS: Config via URL query params (not first message) - matches bridge implementation
   */
  async connect(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) {
      // CONNECTING (0) or OPEN (1)
      if (this.ws.readyState === 1 && this.isConnected) {
        return Promise.resolve(); // Already connected
      }
      // If connecting, wait for it or reject
      return Promise.reject(new Error('STT WebSocket connection already in progress'));
    }

    return new Promise((resolve, reject) => {
      const url = new URL(CARTESIA_CONFIG.STT.ENDPOINT);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('cartesia_version', CARTESIA_CONFIG.API_VERSION);
      // cArTeSiA dOcS: Configuration via URL query params (not first message)
      // This is the recommended approach per Cartesia WebSocket API documentation
      url.searchParams.set('model', CARTESIA_CONFIG.STT.MODEL);
      url.searchParams.set('encoding', CARTESIA_CONFIG.STT.ENCODING);
      url.searchParams.set('sample_rate', String(CARTESIA_CONFIG.STT.SAMPLE_RATE));
      url.searchParams.set('language', CARTESIA_CONFIG.STT.LANGUAGE);
      url.searchParams.set('min_volume', CARTESIA_CONFIG.STT.MIN_VOLUME);
      url.searchParams.set('max_silence_duration_secs', CARTESIA_CONFIG.STT.MAX_SILENCE_DURATION_SECS);

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
          const err = new Error('STT WebSocket connection timeout');
          this.isConnected = false;
          this.isConfigured = false;
          reject(err);
        }
      }, CARTESIA_CONFIG.WS.TIMEOUT_MS);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        console.log('[STT] Connected to Cartesia STT WebSocket');
        this.isConnected = true;
        this.isConfigured = true; // Configured via URL params, no need for configure()
        this.reconnectAttempts = 0;
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        clearTimeout(timeout);
        console.error('[STT] WebSocket error:', error);
        this.isConnected = false;
        this.isConfigured = false;
        if (this.onErrorCallback) {
          this.onErrorCallback(error.message || 'STT WebSocket error', '');
        }
        reject(error);
      });

      this.ws.on('close', (code, reason) => {
        clearTimeout(timeout);
        console.log('[STT] WebSocket closed', { code, reason: reason?.toString() });
        this.isConnected = false;
        this.isConfigured = false;
        if (!this._disconnecting) this.attemptReconnect();
      });
    });
  }

  /**
   * Configure STT session
   * @deprecated Configuration is now done via URL query params in connect()
   * This method is kept for backwards compatibility but is no longer called
   */
  private configure(): void {
    // Configuration is now done via URL query params in connect()
    // This method is kept for backwards compatibility
    console.warn('[STT] configure() called but config is now via URL params');
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      // Check if it's a text message (JSON) or binary (audio)
      if (data instanceof Buffer) {
        // Binary data - this shouldn't happen for responses
        return;
      }

      const message = JSON.parse(data.toString()) as STTResponse;
      
      switch (message.type) {
        case 'transcript':
          this.handleTranscript(message as STTTranscriptResponse);
          break;
        case 'flush_done':
          console.log('[STT] Flush done for request:', message.request_id);
          break;
        case 'done':
          this.handleDone(message as STTDoneResponse);
          break;
        default:
          if ('error' in message) {
            this.handleError(message as STTErrorResponse);
          }
      }
    } catch (error) {
      console.error('[STT] Error parsing message:', error);
    }
  }

  /**
   * Handle transcript response
   */
  private handleTranscript(response: STTTranscriptResponse): void {
    const { text, is_final, request_id } = response;
    
    // Track latency
    const startTime = this.requestStartTimes.get(request_id);
    if (startTime) {
      const latency = Date.now() - startTime;
      
      if (is_final) {
        this.finalLatencies.push(latency);
        console.log(`[STT] Final transcript latency: ${latency}ms`);
      } else {
        this.partialLatencies.push(latency);
        console.log(`[STT] Partial transcript latency: ${latency}ms`);
      }
    }
    
    if (this.onTranscriptCallback) {
      this.onTranscriptCallback(text, is_final, request_id);
    }
  }

  /**
   * Handle done response
   */
  private handleDone(response: STTDoneResponse): void {
    const { request_id } = response;
    
    if (this.requestStartTimes.has(request_id)) {
      this.requestStartTimes.delete(request_id);
    }
    
    if (this.onDoneCallback) {
      this.onDoneCallback(request_id);
    }
  }

  /**
   * Handle error response
   */
  private handleError(response: STTResponse & { error: string }): void {
    const { error, request_id } = response;
    console.error(`[STT] Error for request ${request_id}:`, error);
    
    if (this.onErrorCallback) {
      this.onErrorCallback(error, request_id);
    }
  }

  /**
   * Send audio data
   * cArTeSiA dOcS: Send binary WebSocket messages containing raw audio data
   * Audio should be PCM s16le format at 16000 Hz sample rate
   * Send in small chunks (e.g., 100ms intervals) for optimal latency
   */
  sendAudio(audioBuffer: ArrayBuffer): void {
    if (!this.isConnected || !this.ws || !this.isConfigured) {
      throw new Error('STT WebSocket not connected or configured');
    }

    // Check WebSocket readyState before sending
    if (this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      throw new Error(`STT WebSocket not open (readyState: ${this.ws.readyState})`);
    }

    // Generate request ID if starting new request
    if (!this.currentRequestId) {
      this.currentRequestId = this.generateRequestId();
      this.requestStartTimes.set(this.currentRequestId, Date.now());
    }

    // cArTeSiA dOcS: Send binary WebSocket messages containing raw audio data
    // matching the encoding/sample_rate specified in connection URL
    this.ws.send(Buffer.from(audioBuffer), { binary: true });
  }

  /**
   * Send audio chunk (optimized for 100ms chunks)
   */
  sendAudioChunk(audioBuffer: ArrayBuffer): void {
    this.sendAudio(audioBuffer);
  }

  /**
   * Finalize current transcription request.
   * cArTeSiA dOcS: Send text command "finalize" to flush remaining audio,
   * receive flush_done acknowledgment
   */
  finalize(): void {
    if (!this.isConnected || !this.ws) {
      return;
    }

    // Check WebSocket readyState before sending
    if (this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      console.warn('[STT] Cannot finalize: WebSocket not open (readyState:', this.ws.readyState, ')');
      return;
    }

    this.ws.send('finalize');
  }

  /**
   * Close session and finalize.
   * cArTeSiA dOcS: Send text command "done" to flush remaining audio,
   * close session, receive done acknowledgment
   */
  done(): void {
    if (!this.isConnected || !this.ws) {
      return;
    }

    // Check WebSocket readyState before sending
    if (this.ws.readyState === 1) { // WebSocket.OPEN = 1
      this.ws.send('done');
    }
    this.currentRequestId = null;
  }

  /**
   * Set transcript callback
   */
  onTranscript(callback: STTTranscriptCallback): void {
    this.onTranscriptCallback = callback;
  }

  /**
   * Set done callback
   */
  onDone(callback: STTDoneCallback): void {
    this.onDoneCallback = callback;
  }

  /**
   * Set error callback
   */
  onError(callback: STTErrorCallback): void {
    this.onErrorCallback = callback;
  }

  /**
   * Get average partial latency
   */
  getAveragePartialLatency(): number {
    if (this.partialLatencies.length === 0) return 0;
    return this.partialLatencies.reduce((a, b) => a + b, 0) / this.partialLatencies.length;
  }

  /**
   * Get average final latency
   */
  getAverageFinalLatency(): number {
    if (this.finalLatencies.length === 0) return 0;
    return this.finalLatencies.reduce((a, b) => a + b, 0) / this.finalLatencies.length;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= CARTESIA_CONFIG.WS.MAX_RECONNECT_ATTEMPTS) {
      console.error('[STT] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = CARTESIA_CONFIG.WS.RECONNECT_DELAY * this.reconnectAttempts;
    
    console.log(`[STT] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimerId = setTimeout(() => {
      this.reconnectTimerId = null;
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this._disconnecting = true;
    
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
        
        // Send 'done' if still open
        if (this.ws.readyState === 1) { // WebSocket.OPEN = 1
          try {
            this.ws.send('done');
          } catch {
            // Ignore send errors during disconnect
          }
        }
        
        // Close the connection
        if (this.ws.readyState !== 3) { // Not CLOSED
          this.ws.close();
        }
      } catch (err) {
        console.error('[STT] Error during disconnect:', err);
      } finally {
        this.ws = null;
      }
    }
    
    // Reset state
    this._disconnecting = false;
    this.isConnected = false;
    this.isConfigured = false;
    this.currentRequestId = null;
    this.requestStartTimes.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected && this.isConfigured && this.ws?.readyState === 1; // WebSocket.OPEN = 1
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
