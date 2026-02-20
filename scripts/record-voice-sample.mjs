#!/usr/bin/env node
/**
 * Record your voice from the terminal and build the same payload the frontend sends to n8n.
 * Output: samples/sample-voice.pcm, samples/sample-voice-payload.json
 *
 * Requires: npm install naudiodon (run from project root)
 * Run: node scripts/record-voice-sample.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = join(__dirname, '..', 'samples');

const TARGET_SAMPLE_RATE = 16000;
const TARGET_CHANNELS = 1;

function buildVoicePayload(message, audioBase64) {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const now = new Date().toISOString();
  const attachments = audioBase64
    ? [
        {
          name: 'voice-recording.pcm',
          type: 'audio/pcm',
          size: Math.floor((audioBase64.length * 3) / 4),
          data: audioBase64,
        },
      ]
    : [];
  return {
    message,
    query: message,
    input: message,
    session_id: sessionId,
    sessionId,
    timestamp: now,
    timezone: 'UTC',
    location: 'UTC',
    message_id: messageId,
    messageId,
    source: 'voice',
    attachments,
    locale: 'en-US',
    language: 'en',
  };
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

/**
 * Downsample 48kHz mono s16le to 16kHz by taking every 3rd sample.
 */
function downsample48kTo16k(buffer) {
  const input = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
  const output = new Int16Array(Math.floor(input.length / 3));
  for (let i = 0; i < output.length; i++) output[i] = input[i * 3];
  return Buffer.from(output.buffer);
}

async function recordWithNaudiodon() {
  let portAudio;
  try {
    const mod = await import('naudiodon');
    portAudio = mod.default ?? mod;
  } catch (_e) {
    console.error('naudiodon is not installed. Run: npm install naudiodon');
    process.exit(1);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('\nJARVIS voice sample recorder — same payload format as frontend → n8n\n');
  await ask(rl, 'Press Enter to start recording... ');
  console.log('\nRecording... (Press Enter to stop)\n');

  const chunks = [];
  let ai = null;
  let recordedBuffer = null;
  let use48k = false;

  const enterPromise = new Promise((resolve) => {
    rl.once('line', () => {
      if (ai && typeof ai.quit === 'function') ai.quit();
      resolve();
    });
  });

  const createRecorder = (sampleRate) => {
    const rec = new portAudio.AudioIO({
      inOptions: {
        channelCount: TARGET_CHANNELS,
        sampleFormat: portAudio.SampleFormat16Bit,
        sampleRate,
        deviceId: -1,
        closeOnError: true,
      },
    });
    return rec;
  };

  try {
    ai = createRecorder(TARGET_SAMPLE_RATE);
  } catch (e) {
    if (String(e).includes('sample') || String(e).includes('rate') || String(e).includes('Invalid')) {
      console.log('16 kHz not supported, using 48 kHz (will downsample to 16 kHz).');
      use48k = true;
      ai = createRecorder(48000);
    } else {
      throw e;
    }
  }

  const recordingDone = new Promise((resolve, reject) => {
    ai.on('data', (chunk) => chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk)));
    ai.on('error', reject);
    ai.on('end', () => resolve(Buffer.concat(chunks)));
  });
  ai.start();

  await enterPromise;
  recordedBuffer = await recordingDone;
  if (use48k) recordedBuffer = downsample48kTo16k(recordedBuffer);
  rl.removeAllListeners('line');

  const transcript = (await ask(rl, 'What did you say? (transcript for message field): ')).trim() || 'Recorded voice sample';
  rl.close();

  if (!recordedBuffer.length) {
    console.error('No audio recorded.');
    process.exit(1);
  }

  if (!existsSync(SAMPLES_DIR)) mkdirSync(SAMPLES_DIR, { recursive: true });

  const audioBase64 = recordedBuffer.toString('base64');
  const payload = buildVoicePayload(transcript, audioBase64);
  const pcmPath = join(SAMPLES_DIR, 'sample-voice.pcm');
  const jsonPath = join(SAMPLES_DIR, 'sample-voice-payload.json');

  writeFileSync(pcmPath, recordedBuffer);
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log('\nSaved:');
  console.log(`  ${pcmPath}`);
  console.log(`  ${jsonPath}`);
  console.log(`  Format: PCM s16le, 16 kHz, mono | Message: "${payload.message}"`);
}

recordWithNaudiodon();
