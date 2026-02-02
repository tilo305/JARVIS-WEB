/**
 * Type definitions for Cartesia WebSocket APIs
 * cArTeSiA dOcS.md, cArTeSiA wEbSoCkEt.md
 */

// TTS Types
export interface TTSConfig {
  model_id: string;
  voice: {
    mode: 'id';
    id: string;
  };
  language: string;
  context_id: string;
  output_format: {
    container: 'raw';
    encoding: 'pcm_s16le';
    sample_rate: number;
  };
  add_timestamps: boolean;
  continue: boolean;
  max_buffer_delay_ms?: number;
}

export interface TTSRequest extends Partial<TTSConfig> {
  transcript: string;
}

export interface TTSChunkResponse {
  type: 'chunk';
  data: string; // base64 encoded PCM
  done: boolean;
  status_code: number;
  step_time?: number;
  context_id: string;
}

export interface TTSFlushDoneResponse {
  type: 'flush_done';
  done: boolean;
  flush_done: boolean;
  flush_id: number;
  status_code: number;
  context_id: string;
}

export interface TTSDoneResponse {
  type: 'done';
  done: boolean;
  status_code: number;
  context_id: string;
}

export interface TTSTimestampsResponse {
  type: 'timestamps';
  done: boolean;
  status_code: number;
  context_id: string;
  word_timestamps: {
    words: string[];
    start: number[];
    end: number[];
  };
}

export interface TTSErrorResponse {
  type: string;
  done: boolean;
  error: string;
  status_code: number;
  context_id: string;
}

export type TTSResponse = 
  | TTSChunkResponse 
  | TTSFlushDoneResponse 
  | TTSDoneResponse 
  | TTSTimestampsResponse 
  | TTSErrorResponse;

// STT Types
export interface STTConfig {
  model: string;
  language: string;
  encoding: string;
  sample_rate: string;
  min_volume: string;
  max_silence_duration_secs: string;
}

export interface STTTranscriptResponse {
  type: 'transcript';
  is_final: boolean;
  request_id: string;
  text: string;
  duration: number;
  language: string;
  words: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

export interface STTFlushDoneResponse {
  type: 'flush_done';
  request_id: string;
}

export interface STTDoneResponse {
  type: 'done';
  request_id: string;
}

export interface STTErrorResponse {
  type: string;
  error: string;
  request_id: string;
}

export type STTResponse = 
  | STTTranscriptResponse 
  | STTFlushDoneResponse 
  | STTDoneResponse 
  | STTErrorResponse;

// Event Types
export type TTSAudioCallback = (audioData: ArrayBuffer, contextId: string) => void;
export type TTSDoneCallback = (contextId: string) => void;
export type TTSErrorCallback = (error: string, contextId: string) => void;

export type STTTranscriptCallback = (transcript: string, isFinal: boolean, requestId: string) => void;
export type STTDoneCallback = (requestId: string) => void;
export type STTErrorCallback = (error: string, requestId: string) => void;

// Performance Metrics
export interface PerformanceMetrics {
  ttsFirstByteLatency: number;
  sttPartialLatency: number;
  sttFinalLatency: number;
  endToEndLatency: number;
}
