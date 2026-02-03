import { CartesiaSTTClient } from './stt-client.js';
import { CartesiaTTSClient } from './tts-client.js';
import type { PerformanceMetrics } from './types.js';

/**
 * Bidirectional Conversation Manager
 * Orchestrates STT → Processing → TTS flow with optimal latency.
 * cArTeSiA dOcS.md: process is_final:false immediately, stream TTS as soon as final transcript,
 * continuations for multi-sentence, unique context_id per turn.
 * cArTeSiA wEbSoCkEt.md: research https://docs.cartesia.ai/api-reference/tts/websocket for issues/fixes.
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
   */
  private setupTTSCallbacks(): void {
    this.ttsClient.onAudio((audioData, _contextId) => {
      if (this.onAssistantAudioCallback) {
        this.onAssistantAudioCallback(audioData);
      }
    });

    this.ttsClient.onDone((contextId) => {
      console.log(`[Conversation] TTS done for context: ${contextId}`);
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
   * Optional: stream partial LLM output to TTS with continue:true for ultra-low E2E (not implemented here).
   */
  private async handlePartialTranscript(text: string): Promise<void> {
    if (this.processTranscript) {
      try {
        await this.processTranscript(text);
      } catch (error) {
        console.error('[Conversation] Error processing partial transcript:', error);
      }
    }
  }

  /**
   * Handle final transcript
   */
  private async handleFinalTranscript(text: string): Promise<void> {
    const startTime = Date.now();
    this.conversationHistory.push(`User: ${text}`);

    try {
      // Process transcript (e.g., through LLM)
      let responseText: string;
      
      if (this.processTranscript) {
        responseText = await this.processTranscript(text);
      } else {
        // Default echo response
        responseText = `You said: ${text}`;
      }

      this.conversationHistory.push(`Assistant: ${responseText}`);

      // Generate new context ID for this response
      this.currentContextId = this.generateContextId();

      // Stream response to TTS
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
   * Speak text using TTS with optimal streaming (cArTeSiA dOcS: stream as soon as STT/LLM produces text).
   * Splits into sentences and uses continue:true/false for prosody continuity.
   */
  private speakText(text: string, contextId: string): void {
    // Split text into sentences for continuations (verbatim spacing preserved)
    const sentences = this.splitIntoSentences(text);
    
    if (sentences.length > 1) {
      // Stream multiple sentences with continuations
      this.ttsClient.streamTextChunks(sentences, contextId);
    } else {
      // Single sentence
      this.ttsClient.sendText(text, contextId, false);
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
   */
  sendAudio(audioBuffer: ArrayBuffer): void {
    if (!this.sttClient.isReady()) {
      throw new Error('STT client not ready (not connected or WebSocket not open)');
    }
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
   */
  cancelTTS(): void {
    if (this.currentContextId) {
      this.ttsClient.cancelContext(this.currentContextId);
      this.currentContextId = null;
    }
  }

  /**
   * Initialize and connect both STT and TTS WebSockets in parallel.
   * cArTeSiA dOcS: TTS wss://api.cartesia.ai/tts/websocket, STT wss://api.cartesia.ai/stt/websocket.
   */
  async initialize(): Promise<void> {
    console.log('[Conversation] Initializing bidirectional conversation...');
    
    try {
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
