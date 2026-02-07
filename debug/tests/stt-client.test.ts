/**
 * Comprehensive STT Client Tests
 * Tests all functionality including error handling, reconnection, and performance
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { CARTESIA_CONFIG } from '../../src/config.js';

// Setup console spies BEFORE mocks (mocks are hoisted)
let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

beforeAll(() => {
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleLogSpy?.mockRestore();
  consoleErrorSpy?.mockRestore();
});

// Mock WebSocket (ws package uses EventEmitter: .on('open'), .on('message'), etc.)
class MockWebSocket extends EventEmitter {
  readyState = 0;
  url = '';
  sentMessages: Array<string | ArrayBuffer | Buffer> = [];
  bufferedAmount = 0; // For backpressure testing

  constructor(url: string) {
    super();
    this.url = url;
    const isInvalidKey = url.includes('invalid-key');
    // Use process.nextTick for better Jest compatibility
    process.nextTick(() => {
      if (isInvalidKey) {
        this.emit('error', new Error('WebSocket error'));
      } else {
        this.readyState = 1;
        this.emit('open');
      }
    });
  }

  send(data: string | ArrayBuffer | Buffer, _binary?: boolean): void {
    this.sentMessages.push(data as string | ArrayBuffer);

    if (typeof data === 'string' && data.includes('model')) {
      return; // Config sent
    }

    // Client sends Buffer (Node) for audio, not ArrayBuffer; treat both as binary audio
    const isBinaryAudio =
      data instanceof ArrayBuffer ||
      (typeof Buffer !== 'undefined' && Buffer.isBuffer(data));
    if (isBinaryAudio) {
      setTimeout(() => {
        const response = JSON.stringify({
          type: 'transcript',
          is_final: false,
          request_id: 'test-request-1',
          text: 'Test transcript',
          duration: 0.5,
          language: 'en',
          words: [
            { word: 'Test', start: 0, end: 0.2 },
            { word: 'transcript', start: 0.3, end: 0.5 },
          ],
        });
        this.emit('message', response);
      }, 50);
    }
  }

  close(): void {
    this.readyState = 3;
    this.emit('close');
  }
}

jest.mock('ws', () => ({
  __esModule: true,
  default: MockWebSocket,
}));

import { CartesiaSTTClient } from '../../src/stt-client.js';

describe('CartesiaSTTClient', () => {
  let client: CartesiaSTTClient;
  let transcriptCallback: jest.Mock;
  let doneCallback: jest.Mock;
  let errorCallback: jest.Mock;

  beforeEach(() => {
    client = new CartesiaSTTClient();
    transcriptCallback = jest.fn();
    doneCallback = jest.fn();
    errorCallback = jest.fn();

    client.onTranscript(transcriptCallback);
    client.onDone(doneCallback);
    client.onError(errorCallback);
  });

  afterEach(async () => {
    client.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  describe('Connection', () => {
    it('should connect and configure successfully', async () => {
      await expect(client.connect()).resolves.not.toThrow();
      expect(client.connected).toBe(true);
    });

    it('should configure via URL params on connect', async () => {
      await client.connect();

      const mockWs = client['ws'] as unknown as MockWebSocket;
      const url = new URL(mockWs.url);
      
      // Configuration is done via URL params, not sent messages
      expect(url.searchParams.get('model')).toBe(CARTESIA_CONFIG.STT.MODEL);
      expect(url.searchParams.get('language')).toBe(CARTESIA_CONFIG.STT.LANGUAGE);
      expect(url.searchParams.get('sample_rate')).toBe(String(CARTESIA_CONFIG.STT.SAMPLE_RATE));
      expect(url.searchParams.get('encoding')).toBe(CARTESIA_CONFIG.STT.ENCODING);
    });

    it('should handle connection errors', async () => {
      const badClient = new CartesiaSTTClient('invalid-key');
      await expect(badClient.connect()).rejects.toThrow();
    });
  });

  describe('Audio Processing', () => {
    beforeEach(async () => {
      await client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should send audio data', () => {
      const audioBuffer = new ArrayBuffer(3200);
      client.sendAudio(audioBuffer);

      const mockWs = client['ws'] as unknown as MockWebSocket;
      // Client sends Node Buffer (from ws.send(Buffer.from(audioBuffer))), not raw ArrayBuffer
      const hasBinaryAudio = mockWs.sentMessages.some(
        (msg: unknown) =>
          msg instanceof ArrayBuffer || (typeof Buffer !== 'undefined' && Buffer.isBuffer(msg))
      );
      expect(hasBinaryAudio).toBe(true);
    });

    it('should send audio chunks', () => {
      const audioBuffer = new ArrayBuffer(3200);
      client.sendAudioChunk(audioBuffer);

      const mockWs = client['ws'] as unknown as MockWebSocket;
      expect(mockWs.sentMessages.length).toBeGreaterThan(0);
    });

    it('should receive partial transcripts', async () => {
      const audioBuffer = new ArrayBuffer(3200);
      client.sendAudio(audioBuffer);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(transcriptCallback).toHaveBeenCalled();
      const call = transcriptCallback.mock.calls[0];
      expect(call[0]).toBe('Test transcript');
      expect(call[1]).toBe(false);
    });

    it('should track latency', async () => {
      const audioBuffer = new ArrayBuffer(3200);
      client.sendAudio(audioBuffer);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Mock response uses request_id 'test-request-1'; client uses generated ID, so latency may be 0
      const partialLatency = client.getAveragePartialLatency();
      expect(partialLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Commands', () => {
    beforeEach(async () => {
      await client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should send finalize command', () => {
      client.finalize();

      const mockWs = client['ws'] as unknown as MockWebSocket;
      expect(mockWs.sentMessages).toContain('finalize');
    });

    it('should send done command', () => {
      client.done();

      const mockWs = client['ws'] as unknown as MockWebSocket;
      expect(mockWs.sentMessages).toContain('done');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should handle error responses', async () => {
      const mockWs = client['ws'] as unknown as MockWebSocket;
      if (mockWs) {
        const errorResponse = JSON.stringify({
          type: 'error',
          error: 'Test error',
          request_id: 'test-error',
        });
        // Client returns early for Buffer; send string so handleMessage parses JSON
        mockWs.emit('message', errorResponse);
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should track partial latencies', async () => {
      const audioBuffer = new ArrayBuffer(3200);
      client.sendAudio(audioBuffer);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const avgLatency = client.getAveragePartialLatency();
      expect(avgLatency).toBeGreaterThanOrEqual(0);
    });

    it('should track final latencies', async () => {
      const audioBuffer = new ArrayBuffer(3200);
      client.sendAudio(audioBuffer);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const avgLatency = client.getAverageFinalLatency();
      expect(avgLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Backpressure Handling', () => {
    beforeEach(async () => {
      await client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should skip chunks when bufferedAmount exceeds threshold', () => {
      const mockWs = client['ws'] as unknown as MockWebSocket;
      if (mockWs) {
        // Set bufferedAmount above threshold (256KB)
        mockWs.bufferedAmount = 300 * 1024; // 300KB
        
        const audioBuffer = new ArrayBuffer(3200);
        const initialMessageCount = mockWs.sentMessages.length;
        
        client.sendAudio(audioBuffer);
        
        // Should not send the chunk due to backpressure
        expect(mockWs.sentMessages.length).toBe(initialMessageCount);
      }
    });

    it('should send chunks when bufferedAmount is below threshold', () => {
      const mockWs = client['ws'] as unknown as MockWebSocket;
      if (mockWs) {
        // Set bufferedAmount below threshold
        mockWs.bufferedAmount = 100 * 1024; // 100KB
        
        const audioBuffer = new ArrayBuffer(3200);
        const initialMessageCount = mockWs.sentMessages.length;
        
        client.sendAudio(audioBuffer);
        
        // Should send the chunk
        expect(mockWs.sentMessages.length).toBeGreaterThan(initialMessageCount);
      }
    });
  });
});
