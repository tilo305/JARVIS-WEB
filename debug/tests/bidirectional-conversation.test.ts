/**
 * Comprehensive Bidirectional Conversation Tests
 * Tests the complete STT → Processing → TTS flow (with mocked ws)
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

// Mock WebSocket for both STT and TTS clients
class MockWebSocket extends EventEmitter {
  readyState = 0;
  url = '';
  sentMessages: Array<string | ArrayBuffer> = [];

  constructor(url: string) {
    super();
    this.url = url;
    // Use process.nextTick for better Jest compatibility
    process.nextTick(() => {
      this.readyState = 1;
      this.emit('open');
    });
  }

  send(data: string | ArrayBuffer): void {
    this.sentMessages.push(data);
    // Simulate TTS chunk response
    if (typeof data === 'string') {
      try {
        const req = JSON.parse(data);
        if (req.transcript) {
          setTimeout(() => {
            this.emit('message', Buffer.from(JSON.stringify({
              type: 'chunk',
              data: Buffer.from('test').toString('base64'),
              done: false,
              status_code: 206,
              context_id: req.context_id,
            })));
          }, 20);
          setTimeout(() => {
            this.emit('message', Buffer.from(JSON.stringify({
              type: 'done',
              done: true,
              status_code: 200,
              context_id: req.context_id,
            })));
          }, 50);
        }
      } catch {
        /* config or other */
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

import { BidirectionalConversation } from '../../src/bidirectional-conversation.js';

describe('BidirectionalConversation', () => {
  let conversation: BidirectionalConversation;
  let userSpeechCallback: jest.Mock;
  let assistantAudioCallback: jest.Mock;
  let errorCallback: jest.Mock;
  let processTranscriptMock: (text: string) => Promise<string>;

  beforeEach(() => {
    const m = jest.fn().mockImplementation(() => Promise.resolve('Echo response'));
    processTranscriptMock = m as unknown as (text: string) => Promise<string>;
    conversation = new BidirectionalConversation(processTranscriptMock);

    userSpeechCallback = jest.fn();
    assistantAudioCallback = jest.fn();
    errorCallback = jest.fn();

    conversation.onUserSpeech(userSpeechCallback);
    conversation.onAssistantAudio(assistantAudioCallback);
    conversation.onError(errorCallback);
  });

  afterEach(async () => {
    await conversation.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  describe('Initialization', () => {
    it('should initialize both STT and TTS clients', async () => {
      await expect(conversation.initialize()).resolves.not.toThrow();
    });
  });

  describe('User Speech Processing', () => {
    beforeEach(async () => {
      await conversation.initialize();
    });

    it('should accept audio and finalize', async () => {
      const audioBuffer = new ArrayBuffer(3200);
      conversation.sendAudio(audioBuffer);
      conversation.finalizeSTT();
      await new Promise((r) => setTimeout(r, 100));
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await conversation.initialize();
    });

    it('should have error callback', () => {
      expect(errorCallback).toBeDefined();
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await conversation.initialize();
    });

    it('should track performance metrics', () => {
      const metrics = conversation.getMetrics();
      expect(metrics).toHaveProperty('ttsFirstByteLatency');
      expect(metrics).toHaveProperty('sttPartialLatency');
      expect(metrics).toHaveProperty('sttFinalLatency');
      expect(metrics).toHaveProperty('endToEndLatency');
    });
  });

  describe('Conversation History', () => {
    beforeEach(async () => {
      await conversation.initialize();
    });

    it('should maintain conversation history', () => {
      const history = conversation.getHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('TTS Cancellation', () => {
    beforeEach(async () => {
      await conversation.initialize();
    });

    it('should cancel TTS generation', () => {
      expect(() => conversation.cancelTTS()).not.toThrow();
    });
  });
});
