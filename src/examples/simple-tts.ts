/**
 * Example: Simple TTS Usage
 * 
 * Demonstrates basic text-to-speech generation with continuations
 */

import { CartesiaTTSClient } from '../tts-client.js';
import { writeFileSync } from 'fs';

async function main() {
  console.log('=== Cartesia TTS Example ===\n');

  const tts = new CartesiaTTSClient();
  let audioChunks: Buffer[] = [];

  // Setup callbacks
  tts.onAudio((audioData, contextId) => {
    console.log(`[TTS] Received audio chunk for context: ${contextId}`);
    audioChunks.push(Buffer.from(audioData));
  });

  tts.onDone((contextId) => {
    console.log(`[TTS] Generation complete for context: ${contextId}`);
    
    // Combine all audio chunks
    const fullAudio = Buffer.concat(audioChunks);
    writeFileSync('output_tts.pcm', fullAudio);
    console.log(`[TTS] Saved ${fullAudio.length} bytes to output_tts.pcm`);
    
    audioChunks = [];
  });

  tts.onError((error, contextId) => {
    console.error(`[TTS] Error: ${error} (context: ${contextId})`);
  });

  try {
    // Connect
    await tts.connect();
    console.log('✓ Connected to TTS WebSocket\n');

    // Example 1: Single text message
    console.log('Example 1: Single message');
    const contextId1 = 'example-1';
    tts.sendText('Hello, this is a test of Cartesia TTS!', contextId1, false);
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Example 2: Streaming with continuations
    console.log('\nExample 2: Streaming with continuations');
    const contextId2 = 'example-2';
    const chunks = [
      'Hello, ',
      'this is ',
      'a streaming ',
      'example with continuations.',
    ];
    
    tts.streamTextChunks(chunks, contextId2);
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get latency
    const latency = tts.getFirstByteLatency(contextId2);
    if (latency) {
      console.log(`\nFirst byte latency: ${latency}ms`);
    }

    // Disconnect
    tts.disconnect();
    console.log('\n✓ Disconnected');

  } catch (error) {
    console.error('Error:', error);
    tts.disconnect();
    process.exit(1);
  }
}

main().catch(console.error);
