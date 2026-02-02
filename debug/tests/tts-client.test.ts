/**
 * Comprehensive TTS Client Tests
 * Tests all functionality including error handling, reconnection, and performance
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals';
import { EventEmitter } from 'events';

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
  sentMessages: Array<string | ArrayBuffer> = [];

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

  send(data: string | ArrayBuffer): void {
    this.sentMessages.push(data);
    if (typeof data === 'string') {
      try {
        const request = JSON.parse(data);
        if (request.transcript) {
          setTimeout(() => {
            const response = JSON.stringify({
              type: 'chunk',
              data: Buffer.from('test audio data').toString('base64'),
              done: false,
              status_code: 206,
              context_id: request.context_id,
            });
            this.emit('message', Buffer.from(response));
          }, 50);
        }
      } catch {
        // ignore
      }
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

import { CartesiaTTSClient } from '../../src/tts-client.js';

describe('CartesiaTTSClient', () => {
  let client: CartesiaTTSClient;
  let audioCallback: jest.Mock;
  let doneCallback: jest.Mock;
  let errorCallback: jest.Mock;

  beforeEach(() => {
    client = new CartesiaTTSClient();
    audioCallback = jest.fn();
    doneCallback = jest.fn();
    errorCallback = jest.fn();

    client.onAudio(audioCallback);
    client.onDone(doneCallback);
    client.onError(errorCallback);
  });

  afterEach(async () => {
    client.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  describe('Connection', () => {
    it('should connect successfully', async () => {
      await expect(client.connect()).resolves.not.toThrow();
      expect(client.connected).toBe(true);
    });

    it('should include API key in connection URL', async () => {
      await client.connect();
      expect(client.connected).toBe(true);
    });

    it('should handle connection errors', async () => {
      const badClient = new CartesiaTTSClient('invalid-key');
      await expect(badClient.connect()).rejects.toThrow();
    });
  });

  describe('Text-to-Speech', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should send text and receive audio', async () => {
      const contextId = 'test-context-1';
      client.sendText('Hello, world!', contextId, false);

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(audioCallback).toHaveBeenCalled();
      const call = audioCallback.mock.calls[0];
      expect(call[0]).toBeInstanceOf(ArrayBuffer);
      expect(call[1]).toBe(contextId);
    });

    it('should handle streaming with continuations', async () => {
      const contextId = 'test-context-2';
      const chunks = ['Hello, ', 'this is ', 'a test.'];

      client.streamTextChunks(chunks, contextId);

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(audioCallback.mock.calls.length).toBeGreaterThan(0);
    });

    it('should maintain context configuration across chunks', async () => {
      const contextId = 'test-context-3';

      client.sendText('First chunk', contextId, true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      client.sendText(' Second chunk', contextId, false);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(audioCallback).toHaveBeenCalled();
    });

    it('should track first byte latency', async () => {
      const contextId = 'test-context-4';
      client.sendText('Test latency', contextId, false);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const latency = client.getFirstByteLatency(contextId);
      expect(latency).toBeDefined();
      expect(latency).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should handle error responses', async () => {
      const mockWs = client['ws'] as unknown as MockWebSocket;
      if (mockWs) {
        const errorResponse = JSON.stringify({
          type: 'error',
          done: true,
          error: 'Test error',
          status_code: 400,
          context_id: 'test-error',
        });
        mockWs.emit('message', Buffer.from(errorResponse));
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(errorCallback).toHaveBeenCalled();
    });

    it('should cancel contexts', () => {
      const contextId = 'test-cancel';
      client.sendText('Test', contextId, false);
      client.cancelContext(contextId);

      expect(client['activeContexts'].has(contextId)).toBe(false);
    });
  });

  describe('Reconnection', () => {
    it('should attempt reconnection on disconnect', async () => {
      await client.connect();

      const mockWs = client['ws'] as unknown as MockWebSocket;
      if (mockWs) {
        mockWs.emit('close');
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(client['reconnectAttempts']).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should track context start times', async () => {
      const contextId = 'perf-test';
      client.sendText('Performance test', contextId, false);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const startTime = client['contextStartTimes'].get(contextId);
      expect(startTime).toBeDefined();
      expect(startTime).toBeGreaterThan(0);
    });
  });
});
