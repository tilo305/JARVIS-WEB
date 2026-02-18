import { CartesiaSTTClient } from './stt-client.js';
import { CartesiaTTSClient } from './tts-client.js';
import { CARTESIA_CONFIG } from './config.js';
import type { PerformanceMetrics } from './types.js';

/**
 * Bidirectional Conversation Manager
 * Orchestrates STT → Processing → TTS flow with optimal latency.
 * cArTeSiA dOcS.md: process is_final:false immediately, stream TTS as soon as final transcript,
 * continuations for multi-sentence, unique context_id per turn.
 * cArTeSiA dOcS.md
 */
export class BidirectionalConversation {
  private sttClient: CartesiaSTTClient;
  private ttsClient: CartesiaTTSClient;
  private currentContextId: string | null = null;
  private conversationHistory: string[] = [];
  
  // Performance metrics
  private metrics: PerformanceMetrics = {
    ttsFirstByteLatency: 0,
    sttPartialLatency: 0,
    sttFinalLatency: 0,
    endToEndLatency: 0,
  };
  
  // Callbacks
  private onUserSpeechCallback?: (text: string, isFinal: boolean) => void;
  private onAssistantAudioCallback?: (audioData: ArrayBuffer) => void;
  private onErrorCallback?: (error: string) => void;

  constructor(
    private processTranscript?: (text: string) => Promise<string>
  ) {
    this.sttClient = new CartesiaSTTClient();
    this.ttsClient = new CartesiaTTSClient();
    // Bridge: STT WebSocket (streaming) ↔ callbacks ↔ TTS WebSocket (streaming). Both connected in initialize().
    this.setupSTTCallbacks();
    this.setupTTSCallbacks();
  }

  /**
   * Setup STT client callbacks
   */
  private setupSTTCallbacks(): void {
    this.sttClient.onTranscript((text, isFinal, _requestId) => {
      console.log(`[Conversation] STT ${isFinal ? 'FINAL' : 'PARTIAL'}: ${text}`);
      
      if (this.onUserSpeechCallback) {
        this.onUserSpeechCallback(text, isFinal);
      }

      // Process partial transcripts immediately for low latency
      if (!isFinal) {
        this.handlePartialTranscript(text);
      } else {
        this.handleFinalTranscript(text);
      }
    });

    this.sttClient.onError((error, _requestId) => {
      console.error(`[Conversation] STT error: ${error}`);
      if (this.onErrorCallback) {
        this.onErrorCallback(`STT Error: ${error}`);
      }
    });
  }

  /**
   * Setup TTS client callbacks
   * Optimized: Callbacks are non-blocking and fire immediately
   */
  private setupTTSCallbacks(): void {
    this.ttsClient.onAudio((audioData, _contextId) => {
      // Callback fires immediately when audio chunk arrives
      // This is non-blocking and allows for real-time streaming
      if (this.onAssistantAudioCallback) {
        this.onAssistantAudioCallback(audioData);
      }
    });

    this.ttsClient.onDone((contextId) => {
      console.log(`[Conversation] TTS done for context: ${contextId}`);
      // Clear context ID when done to allow new responses
      if (this.currentContextId === contextId) {
        this.currentContextId = null;
      }
    });

    this.ttsClient.onError((error, _contextId) => {
      console.error(`[Conversation] TTS error: ${error}`);
      if (this.onErrorCallback) {
        this.onErrorCallback(`TTS Error: ${error}`);
      }
    });
  }

  /**
   * Handle partial transcript (cArTeSiA dOcS: process is_final:false immediately for low latency).
   * Non-blocking: fires and forgets to avoid delaying audio processing.
   * Optimized: Minimal overhead, immediate callback invocation.
   * Note: onUserSpeechCallback is already called in setupSTTCallbacks, so we don't call it here.
   */
  private handlePartialTranscript(text: string): void {
    // Non-blocking: don't await to avoid blocking audio pipeline
    if (this.processTranscript) {
      // Fire and forget - process in background for potential early TTS start
      this.processTranscript(text).catch((error) => {
        console.error('[Conversation] Error processing partial transcript:', error);
      });
    }
  }

  /**
   * Handle final transcript
   * Optimized for low latency: cancels any ongoing TTS before processing new request.
   * Non-blocking where possible to maintain audio pipeline responsiveness.
   * Note: onUserSpeechCallback is already called in setupSTTCallbacks, so we don't call it here.
   */
  private async handleFinalTranscript(text: string): Promise<void> {
    const startTime = Date.now();
    
    // Cancel any ongoing TTS immediately on new user input (barge-in optimization)
    // This must be synchronous for immediate response
    if (this.currentContextId) {
      this.cancelTTS();
    }
    
    this.conversationHistory.push(`User: ${text}`);

    try {
      // Process transcript (e.g., through LLM)
      // This is the main latency bottleneck - optimize the processTranscript function
      let responseText: string;
      
      if (this.processTranscript) {
        responseText = await this.processTranscript(text);
      } else {
        // Default echo response
        responseText = `You said: ${text}`;
      }

      // Note: Race condition protection is handled by cancelTTS() being called
      // at the start of handleFinalTranscript() before processing begins

      this.conversationHistory.push(`Assistant: ${responseText}`);

      // Generate new context ID for this response
      this.currentContextId = this.generateContextId();

      // Stream response to TTS immediately (non-blocking send)
      // TTS client handles the actual WebSocket send asynchronously
      this.speakText(responseText, this.currentContextId);

      // Calculate end-to-end latency
      const endToEndLatency = Date.now() - startTime;
      this.metrics.endToEndLatency = endToEndLatency;
      console.log(`[Conversation] End-to-end latency: ${endToEndLatency}ms`);

    } catch (error) {
      console.error('[Conversation] Error processing final transcript:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Processing Error: ${error}`);
      }
    }
  }

  /**
   * Strip markdown and symbols so TTS speaks only words (no "asterisk", "bold", etc.).
   * Matches public/js/app.js stripMarkdownForTTS for consistency.
   */
  private stripMarkdownForTTS(text: string): string {
    if (typeof text !== 'string' && text != null) text = String(text);
    if (!text || !text.trim()) return '';
    const t = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*+/g, '')
      .replace(/_+/g, ' ')
      .replace(/\s+/g, ' ');
    return t.trim();
  }

  /**
   * Speak text using TTS with optimal streaming (cArTeSiA dOcS: stream as soon as STT/LLM produces text).
   * Splits into sentences and uses continue:true/false for prosody continuity.
   * Optimized for minimal latency: sends chunks immediately without batching.
   * Strips markdown so TTS does not speak "asterisk", "bold", or other symbols.
   */
  private speakText(text: string, contextId: string): void {
    const safeText = this.stripMarkdownForTTS(text);
    if (!safeText) {
      console.warn('[Conversation] Empty text after stripMarkdownForTTS');
      return;
    }

    // Split text into sentences for continuations (verbatim spacing preserved)
    const sentences = this.splitIntoSentences(safeText);
    
    if (sentences.length > 1) {
      // Stream multiple sentences with continuations
      // streamTextChunks sends all chunks immediately for optimal latency
      this.ttsClient.streamTextChunks(sentences, contextId);
    } else {
      // Single sentence - send immediately
      this.ttsClient.sendText(safeText, contextId, false);
    }
  }

  /**
   * Split text into sentences for TTS continuations.
   * cArTeSiA dOcS: transcripts concatenated verbatim — include spacing and punctuation.
   */
  private splitIntoSentences(text: string): string[] {
    const trimmed = text.trim();
    if (!trimmed) return [];
    // Split on space(s) that follow sentence-ending punctuation; keep punctuation on sentence.
    const sentences = trimmed.split(/(?<=[.!?])\s+/);
    return sentences.filter((s) => s.length > 0);
  }

  /**
   * Send audio to STT
   * Optimized: Minimal validation, direct send for lowest latency.
   */
  sendAudio(audioBuffer: ArrayBuffer): void {
    // Fast path: check ready state inline (minimal overhead)
    if (!this.sttClient.isReady()) {
      // Try to reconnect if connection is lost (non-blocking)
      if (CARTESIA_CONFIG.WS.PERSIST_CONNECTIONS) {
        this.sttClient.connect().catch((err) => {
          console.error('[Conversation] STT reconnection failed:', err);
        });
      }
      throw new Error('STT client not ready (not connected or WebSocket not open)');
    }
    // Direct send - no buffering for optimal latency
    this.sttClient.sendAudioChunk(audioBuffer);
  }

  /**
   * Finalize current STT request
   */
  finalizeSTT(): void {
    this.sttClient.finalize();
  }

  /**
   * Cancel current TTS generation
   * Optimized for barge-in: immediately stops TTS and clears context.
   * Synchronous for zero-latency interruption.
   */
  cancelTTS(): void {
    if (this.currentContextId) {
      const contextIdToCancel = this.currentContextId;
      this.currentContextId = null; // Clear immediately to prevent race conditions
      // Cancel synchronously - don't await to avoid any delay
      try {
        this.ttsClient.cancelContext(contextIdToCancel);
      } catch (err) {
        // Log but don't throw - barge-in should always succeed
        console.warn(`[Conversation] TTS cancel warning: ${err}`);
      }
      console.log(`[Conversation] TTS cancelled for barge-in: ${contextIdToCancel}`);
    }
  }

  /**
   * Handle barge-in: user interrupts assistant speech
   * Cancels TTS and prepares for new user input.
   * Optimized: Immediate synchronous cancellation for zero-latency response.
   */
  handleBargeIn(): void {
    // Synchronous cancellation - no async operations
    this.cancelTTS();
    // Clear any pending TTS operations immediately
    // Note: STT should continue running to capture the new user input
    // This is handled by the audio bridge's barge-in logic
  }

  /**
   * Initialize and connect both STT and TTS WebSockets in parallel.
   * cArTeSiA dOcS: TTS wss://api.cartesia.ai/tts/websocket, STT wss://api.cartesia.ai/stt/websocket.
   * Optimized: Pre-connects if enabled in config for zero-latency first request.
   */
  async initialize(): Promise<void> {
    console.log('[Conversation] Initializing bidirectional conversation...');
    
    try {
      // Connect in parallel for optimal latency
      await Promise.all([
        this.sttClient.connect(),
        this.ttsClient.connect(),
      ]);
      
      console.log('[Conversation] Both clients connected successfully');
    } catch (error) {
      console.error('[Conversation] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Pre-connect WebSockets if not already connected.
   * Call this early (e.g., on app load) to eliminate connection latency for first request.
   */
  async preConnect(): Promise<void> {
    if (CARTESIA_CONFIG.WS.PRE_CONNECT) {
      try {
        // Connect in parallel, but don't throw if already connected
        await Promise.allSettled([
          this.sttClient.connect().catch((err) => {
            // Check if already connected or if error indicates connection in progress
            if (this.sttClient.connected) {
              return; // Already connected
            }
            const errMsg = err instanceof Error ? err.message : String(err);
            if (errMsg.includes('already in progress') || errMsg.includes('already connected')) {
              return; // Connection in progress, ignore
            }
            throw err; // Re-throw other errors
          }),
          this.ttsClient.connect().catch((err) => {
            // Check if already connected or if error indicates connection in progress
            if (this.ttsClient.connected) {
              return; // Already connected
            }
            const errMsg = err instanceof Error ? err.message : String(err);
            if (errMsg.includes('already in progress') || errMsg.includes('already connected')) {
              return; // Connection in progress, ignore
            }
            throw err; // Re-throw other errors
          }),
        ]);
        console.log('[Conversation] Pre-connection completed');
      } catch (error) {
        console.warn('[Conversation] Pre-connection warning (non-fatal):', error);
        // Don't throw - pre-connection is optional
      }
    }
  }

  /**
   * Set user speech callback
   */
  onUserSpeech(callback: (text: string, isFinal: boolean) => void): void {
    this.onUserSpeechCallback = callback;
  }

  /**
   * Set assistant audio callback
   */
  onAssistantAudio(callback: (audioData: ArrayBuffer) => void): void {
    this.onAssistantAudioCallback = callback;
  }

  /**
   * Set error callback
   */
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      sttPartialLatency: this.sttClient.getAveragePartialLatency(),
      sttFinalLatency: this.sttClient.getAverageFinalLatency(),
    };
  }

  /**
   * Get conversation history
   */
  getHistory(): string[] {
    return [...this.conversationHistory];
  }

  /**
   * Generate unique context ID
   */
  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect(): Promise<void> {
    console.log('[Conversation] Disconnecting...');
    
    try {
      // Finalize STT if connected
      if (this.sttClient.isReady()) {
        this.sttClient.done();
      }
    } catch (err) {
      console.error('[Conversation] Error finalizing STT:', err);
    }
    
    this.sttClient.disconnect();
    this.ttsClient.disconnect();
    
    this.currentContextId = null;
    this.conversationHistory = [];
  }
}
