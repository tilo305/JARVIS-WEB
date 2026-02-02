/**
 * Example: Simple STT Usage
 * 
 * Demonstrates basic speech-to-text transcription
 */

import { CartesiaSTTClient } from '../stt-client.js';

async function main() {
  console.log('=== Cartesia STT Example ===\n');

  const stt = new CartesiaSTTClient();

  // Setup callbacks
  stt.onTranscript((text, isFinal, requestId) => {
    console.log(`[STT] ${isFinal ? 'FINAL' : 'PARTIAL'} (${requestId}): ${text}`);
  });

  stt.onDone((requestId) => {
    console.log(`[STT] Done for request: ${requestId}`);
    console.log(`[STT] Average partial latency: ${stt.getAveragePartialLatency().toFixed(2)}ms`);
    console.log(`[STT] Average final latency: ${stt.getAverageFinalLatency().toFixed(2)}ms`);
  });

  stt.onError((error, requestId) => {
    console.error(`[STT] Error: ${error} (request: ${requestId})`);
  });

  try {
    // Connect
    await stt.connect();
    console.log('✓ Connected to STT WebSocket\n');

    // Example: Send audio data
    // Note: Audio must be PCM s16le format at 16000 Hz
    // In production, you'd capture this from a microphone
    
    console.log('To use STT:');
    console.log('1. Capture audio from microphone');
    console.log('2. Convert to PCM s16le, 16000 Hz');
    console.log('3. Send 100ms chunks via stt.sendAudioChunk(audioBuffer)');
    console.log('4. Call stt.finalize() when done');
    console.log('5. Call stt.done() to close session\n');

    // Keep connection alive
    console.log('STT ready. Press Ctrl+C to exit.\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Disconnect
    stt.done();
    stt.disconnect();
    console.log('\n✓ Disconnected');

  } catch (error) {
    console.error('Error:', error);
    stt.disconnect();
    process.exit(1);
  }
}

main().catch(console.error);
