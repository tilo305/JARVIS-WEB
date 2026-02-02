/**
 * LIVE Cartesia WebSocket Connectivity Test
 * Connects to real TTS/STT endpoints. Skips if CARTESIA_API_KEY is missing.
 * Per zEn DeBuGgEr.md - debug folder LIVE integration tests.
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import WebSocket from 'ws';
import { CARTESIA_CONFIG } from '../../../src/config.js';

const API_KEY = process.env.CARTESIA_API_KEY || CARTESIA_CONFIG.API_KEY;
const SKIP_LIVE = !API_KEY || API_KEY.length < 10;

describe('LIVE Cartesia WebSocket (integration)', () => {
  let ttsWs: WebSocket | null = null;
  let sttWs: WebSocket | null = null;

  beforeAll(() => {
    if (SKIP_LIVE) {
      console.warn('[LIVE] Skipping: CARTESIA_API_KEY not set or invalid');
    }
  });

  afterAll(() => {
    if (ttsWs) ttsWs.close();
    if (sttWs) sttWs.close();
  });

  it(
    'should connect to TTS WebSocket and receive response',
    async () => {
      if (SKIP_LIVE) return;

      const url = new URL(CARTESIA_CONFIG.TTS.ENDPOINT);
      url.searchParams.set('api_key', API_KEY);
      url.searchParams.set('cartesia_version', CARTESIA_CONFIG.API_VERSION);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ttsWs?.close();
          reject(new Error('TTS WebSocket timeout'));
        }, 10000);

        ttsWs = new WebSocket(url.toString());

        ttsWs.on('open', () => {
          const msg = JSON.stringify({
            model_id: CARTESIA_CONFIG.TTS.MODEL,
            transcript: 'Test',
            voice: { mode: 'id', id: CARTESIA_CONFIG.VOICE_ID },
            language: 'en',
            context_id: 'debug-test',
            output_format: {
              container: 'raw',
              encoding: 'pcm_s16le',
              sample_rate: 8000,
            },
            continue: false,
          });
          ttsWs!.send(msg);
        });

        ttsWs.on('message', (data: WebSocket.Data) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'chunk' || msg.type === 'done') {
            clearTimeout(timeout);
            expect(msg.type).toBeDefined();
            ttsWs!.close();
            resolve();
          }
          if (msg.error) {
            clearTimeout(timeout);
            ttsWs!.close();
            reject(new Error(msg.error));
          }
        });

        ttsWs.on('error', () => {
          clearTimeout(timeout);
          reject(new Error('TTS WebSocket error'));
        });
      });
    },
    15000
  );

  it(
    'should connect to STT WebSocket and accept config',
    async () => {
      if (SKIP_LIVE) return;

      const url = new URL(CARTESIA_CONFIG.STT.ENDPOINT);
      url.searchParams.set('api_key', API_KEY);
      url.searchParams.set('cartesia_version', CARTESIA_CONFIG.API_VERSION);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          sttWs?.close();
          reject(new Error('STT WebSocket timeout'));
        }, 8000);

        sttWs = new WebSocket(url.toString());

        sttWs.on('open', () => {
          sttWs!.send(
            JSON.stringify({
              model: CARTESIA_CONFIG.STT.MODEL,
              language: 'en',
              encoding: 'pcm_s16le',
              sample_rate: '16000',
              min_volume: '0.0',
              max_silence_duration_secs: '2.0',
            })
          );
          clearTimeout(timeout);
          sttWs!.close();
          resolve();
        });

        sttWs.on('error', () => {
          clearTimeout(timeout);
          reject(new Error('STT WebSocket error'));
        });
      });
    },
    10000
  );
});
