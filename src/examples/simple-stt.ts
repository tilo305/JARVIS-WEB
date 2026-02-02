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

    // Example: If you have a PCM file
    // try {
    //   const audioData = readFileSync('input_audio.pcm');
    //   console.log(`Sending ${audioData.length} bytes of audio...\n`);
    //   
    //   // Send in 100ms chunks (1600 samples at 16kHz = 100ms)
    //   const chunkSize = 1600 * 2; // 16-bit = 2 bytes per sample
    //   for (let i = 0; i < audioData.length; i += chunkSize) {
    //     const chunk = audioData.slice(i, i + chunkSize);
    //     stt.sendAudioChunk(chunk.buffer);
    //     await new Promise(resolve => setTimeout(resolve, 100));
    //   }
    //   
    //   stt.finalize();
    //   await new Promise(resolve => setTimeout(resolve, 2000));
    // } catch (error) {
    //   console.log('No input_audio.pcm file found (this is expected)');
    // }

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
