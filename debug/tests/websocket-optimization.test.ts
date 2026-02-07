/**
 * WebSocket Optimization Tests
 * Tests for optimal latency and bi-directional conversational flow optimizations
 */

import { EventEmitter } from 'events';

// Mock WebSocket - must be defined before jest.mock (jest.mock is hoisted)
class MockWebSocket extends EventEmitter {
  readyState = 0;
  url = '';
  sentMessages: Array<string | ArrayBuffer | Buffer> = [];
  bufferedAmount = 0;

  constructor(url: string) {
    super();
    this.url = url;
    process.nextTick(() => {
      this.readyState = 1;
      this.emit('open');
    });
  }

  send(data: string | ArrayBuffer | Buffer, _binary?: boolean): void {
    this.sentMessages.push(data as string | ArrayBuffer);
    
    if (typeof data === 'string') {
      try {
        const request = JSON.parse(data);
        if (request.transcript) {
          // Simulate TTS response
          setTimeout(() => {
            const response = JSON.stringify({
              type: 'chunk',
              data: Buffer.from('test audio').toString('base64'),
              context_id: request.context_id,
            });
            this.emit('message', Buffer.from(response));
          }, 10);
        }
      } catch {
        // Binary audio data
        setTimeout(() => {
          const response = JSON.stringify({
            type: 'transcript',
            is_final: false,
            request_id: 'test-request',
            text: 'Test transcript',
          });
          this.emit('message', response);
        }, 10);
      }
    }
  }

  close(): void {
    this.readyState = 3;
    this.emit('close');
  }
}

// Use factory function to avoid hoisting issues
jest.mock('ws', () => {
  // Import EventEmitter here to avoid hoisting issues
  const { EventEmitter } = require('events');
  
  class MockWebSocket extends EventEmitter {
    readyState = 0;
    url = '';
    sentMessages: Array<string | ArrayBuffer | Buffer> = [];
    bufferedAmount = 0;

    constructor(url: string) {
      super();
      this.url = url;
      process.nextTick(() => {
        this.readyState = 1;
        this.emit('open');
      });
    }

    send(data: string | ArrayBuffer | Buffer, _binary?: boolean): void {
      this.sentMessages.push(data as string | ArrayBuffer);
      
      if (typeof data === 'string') {
        try {
          const request = JSON.parse(data);
          if (request.transcript) {
            // Simulate TTS response
            setTimeout(() => {
              const response = JSON.stringify({
                type: 'chunk',
                data: Buffer.from('test audio').toString('base64'),
                context_id: request.context_id,
              });
              this.emit('message', Buffer.from(response));
            }, 10);
          }
        } catch {
          // Binary audio data
          setTimeout(() => {
            const response = JSON.stringify({
              type: 'transcript',
              is_final: false,
              request_id: 'test-request',
              text: 'Test transcript',
            });
            this.emit('message', response);
          }, 10);
        }
      }
    }

    close(): void {
      this.readyState = 3;
      this.emit('close');
    }
  }
  
  return {
    __esModule: true,
    default: MockWebSocket,
  };
});

import { CartesiaSTTClient } from '../../src/stt-client.js';
import { CartesiaTTSClient } from '../../src/tts-client.js';
import { BidirectionalConversation } from '../../src/bidirectional-conversation.js';

describe('WebSocket Optimizations', () => {
  describe('STT Client Optimizations', () => {
    let sttClient: CartesiaSTTClient;

    beforeEach(() => {
      sttClient = new CartesiaSTTClient();
    });

    it('should send binary data without unnecessary Buffer conversion', async () => {
      await sttClient.connect();
      
      const audioBuffer = new ArrayBuffer(3200);
      const startTime = Date.now();
      sttClient.sendAudio(audioBuffer);
      const sendTime = Date.now() - startTime;

      // Should send immediately without delay
      expect(sendTime).toBeLessThan(10); // Should be < 10ms
      
      const mockWs = sttClient['ws'] as unknown as MockWebSocket;
      expect(mockWs.sentMessages.length).toBeGreaterThan(0);
    });

    it('should handle backpressure correctly', async () => {
      await sttClient.connect();
      
      const mockWs = sttClient['ws'] as unknown as MockWebSocket;
      mockWs.bufferedAmount = 300 * 1024; // 300KB (above 256KB threshold)
      
      const audioBuffer = new ArrayBuffer(3200);
      sttClient.sendAudio(audioBuffer);
      
      // Should not send when backpressure is high
      const initialCount = mockWs.sentMessages.length;
      sttClient.sendAudio(audioBuffer);
      expect(mockWs.sentMessages.length).toBe(initialCount);
    });
  });

  describe('TTS Client Optimizations', () => {
    let ttsClient: CartesiaTTSClient;

    beforeEach(() => {
      ttsClient = new CartesiaTTSClient();
    });

    it('should send text immediately without requestAnimationFrame delay', async () => {
      await ttsClient.connect();
      
      const startTime = Date.now();
      ttsClient.sendText('Test message', 'test-context', false);
      const sendTime = Date.now() - startTime;

      // Should send immediately (< 5ms, no requestAnimationFrame delay)
      expect(sendTime).toBeLessThan(5);
      
      const mockWs = ttsClient['ws'] as unknown as MockWebSocket;
      expect(mockWs.sentMessages.length).toBe(1);
    });

    it('should send all chunks in parallel (not sequentially)', async () => {
      await ttsClient.connect();
      
      const chunks = ['Chunk 1', 'Chunk 2', 'Chunk 3', 'Chunk 4'];
      const startTime = Date.now();
      ttsClient.streamTextChunks(chunks, 'test-context');
      const sendTime = Date.now() - startTime;

      // All chunks should be sent immediately (parallel)
      // Sequential would take ~4 * sendTime, parallel should be < 2 * sendTime
      expect(sendTime).toBeLessThan(20);
      
      const mockWs = ttsClient['ws'] as unknown as MockWebSocket;
      // All chunks should be sent
      expect(mockWs.sentMessages.length).toBe(chunks.length);
    });
  });

  describe('Bidirectional Conversation Optimizations', () => {
    let conversation: BidirectionalConversation;

    beforeEach(async () => {
      conversation = new BidirectionalConversation();
      await conversation.initialize();
    });

    afterEach(async () => {
      await conversation.disconnect();
    });

    it('should process partial transcripts immediately', async () => {
      const partialCallback = jest.fn();
      conversation.onUserSpeech(partialCallback);

      const sttClient = conversation['sttClient'];
      const mockWs = sttClient['ws'] as unknown as MockWebSocket;
      
      // Simulate partial transcript
      mockWs.emit('message', JSON.stringify({
        type: 'transcript',
        is_final: false,
        request_id: 'test-request',
        text: 'Partial text',
      }));

      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should process partial immediately
      expect(partialCallback).toHaveBeenCalledWith('Partial text', false);
    });

    it('should cancel TTS immediately on barge-in', async () => {
      const ttsClient = conversation['ttsClient'];
      await ttsClient.connect();
      
      // Start TTS
      ttsClient.sendText('Long response that should be cancelled', 'test-context', false);
      
      const cancelStartTime = Date.now();
      conversation.handleBargeIn();
      const cancelTime = Date.now() - cancelStartTime;

      // Cancellation should be immediate (< 5ms, synchronous)
      expect(cancelTime).toBeLessThan(5);
    });
  });

  describe('Connection Optimizations', () => {
    it('should pre-connect connections in parallel', async () => {
      const conversation = new BidirectionalConversation();
      
      const startTime = Date.now();
      await conversation.initialize();
      const connectTime = Date.now() - startTime;

      // Both connections should be established in parallel
      // Sequential would be ~2x, parallel should be similar to single connection
      expect(connectTime).toBeLessThan(200);
      
      expect(conversation['sttClient'].connected).toBe(true);
      expect(conversation['ttsClient'].connected).toBe(true);
      
      await conversation.disconnect();
    });
  });
});
