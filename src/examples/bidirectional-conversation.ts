/**
 * Example: Bidirectional Conversation with Cartesia STT and TTS
 *
 * This example demonstrates:
 * - Connecting to both STT and TTS WebSockets
 * - Processing user speech in real-time
 * - Generating and streaming assistant responses
 * - Optimal latency configuration
 */

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { writeFileSync } from 'fs';
import { BidirectionalConversation } from '../bidirectional-conversation.js';

/**
 * Example transcript processor - calls n8n webhook for LLM
 * Uses proper payload structure with session_id, timestamp, timezone, etc. for consistency.
 */
import { N8N_WEBHOOK_URL } from '../config.js';

// Session ID for this example session (persists for the lifetime of the process)
const exampleSessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

/**
 * Build n8n payload with all required fields (matching browser payload structure)
 */
function buildN8nPayload(message: string, source: 'voice' | 'text' = 'voice'): Record<string, unknown> {
  const now = new Date().toISOString();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  
  // Get timezone (Node.js compatible)
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone;
  } catch {
    // Fallback to UTC if Intl is not available
  }

  return {
    message: message.trim(),
    session_id: exampleSessionId,
    sessionId: exampleSessionId,
    timestamp: now,
    timezone,
    location: timezone,
    message_id: messageId,
    messageId,
    source,
    attachments: [],
  };
}

/**
 * Extract reply from n8n response (checks multiple possible keys)
 */
function extractReplyFromJson(data: Record<string, unknown>): string | null {
  if (!data || typeof data !== 'object') return null;
  
  const keys = ['output', 'reply', 'result', 'text', 'message', 'response', 'answer', 'content', 'body', 'responseText'];
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string') return value;
  }
  
  // Check if it's an array (n8n item format)
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const nested = extractReplyFromJson(first as Record<string, unknown>);
      if (nested) return nested;
      // Check n8n item format: { json: { output: "..." } }
      if ('json' in first && typeof first.json === 'object') {
        const fromJson = extractReplyFromJson(first.json as Record<string, unknown>);
        if (fromJson) return fromJson;
      }
    }
  }
  
  return null;
}

async function processTranscript(userText: string): Promise<string> {
  try {
    const payload = buildN8nPayload(userText, 'voice');
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      console.error(`[processTranscript] n8n returned status ${res.status}`);
      return "Sorry, I couldn't reach the assistant.";
    }
    
    const contentType = res.headers.get('content-type') || '';
    let data: Record<string, unknown> = {};
    
    if (contentType.includes('application/json')) {
      data = (await res.json()) as Record<string, unknown>;
    } else {
      const text = await res.text();
      if (text.trim()) {
        try {
          data = JSON.parse(text) as Record<string, unknown>;
        } catch {
          data = { output: text.trim() };
        }
      }
    }
    
    const reply = extractReplyFromJson(data);
    if (typeof reply === 'string' && reply.trim()) {
      return reply;
    }
    
    return `I heard you say: "${userText}". Configure your n8n workflow to return a reply in one of these keys: output, reply, result, text, message, response, answer, content.`;
  } catch (err) {
    console.error('[processTranscript] n8n error:', err);
    return "Sorry, I couldn't reach the assistant.";
  }
}

/**
 * Main example function
 */
async function main() {
  console.log('=== Cartesia Bidirectional Conversation Example ===\n');

  // Create conversation manager
  const conversation = new BidirectionalConversation(processTranscript);

  // Setup callbacks
  conversation.onUserSpeech((text, isFinal) => {
    console.log(`\n[User] ${isFinal ? 'FINAL' : 'PARTIAL'}: ${text}`);
  });

  conversation.onAssistantAudio((audioData) => {
    // Save audio to file (for testing)
    // In production, you'd play this audio directly
    const buffer = Buffer.from(audioData);
    writeFileSync('output_audio.pcm', buffer, { flag: 'a' });
    console.log(`[Assistant] Audio chunk received: ${buffer.length} bytes`);
  });

  conversation.onError((error) => {
    console.error(`[Error] ${error}`);
  });

  try {
    // Initialize connections
    await conversation.initialize();
    console.log('\n✓ Both STT and TTS clients connected\n');

    // Example: Simulate receiving audio chunks
    // In a real application, you would:
    // 1. Capture audio from microphone
    // 2. Convert to PCM s16le format at 16000 Hz
    // 3. Send 100ms chunks via sendAudio()
    
    console.log('Example usage:');
    console.log('1. Capture audio from microphone');
    console.log('2. Convert to PCM s16le, 16000 Hz');
    console.log('3. Call conversation.sendAudio(audioBuffer) with 100ms chunks');
    console.log('4. Call conversation.finalizeSTT() when user stops speaking');
    console.log('5. Audio responses will be received via onAssistantAudio callback\n');

    // Simulate audio input (for testing)
    // In production, replace this with actual microphone input
    console.log('Simulating audio input...\n');
    
    // Note: This is a placeholder - you need actual PCM audio data
    // For a complete example, you'd need to:
    // - Use a library like 'node-record-lpcm16' for microphone input
    // - Or read from a WAV file and convert to PCM
    
    // Example: If you have a PCM file
    // const audioData = readFileSync('input_audio.pcm');
    // conversation.sendAudio(audioData.buffer);
    // conversation.finalizeSTT();

    // Keep connection alive for demonstration
    console.log('Conversation ready. Press Ctrl+C to exit.\n');
    
    // In a real application, you'd keep this running and handle audio I/O
    // For now, we'll just wait a bit then disconnect
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get performance metrics
    const metrics = conversation.getMetrics();
    console.log('\n=== Performance Metrics ===');
    console.log(`STT Partial Latency: ${metrics.sttPartialLatency.toFixed(2)}ms`);
    console.log(`STT Final Latency: ${metrics.sttFinalLatency.toFixed(2)}ms`);
    console.log(`TTS First Byte Latency: ${metrics.ttsFirstByteLatency.toFixed(2)}ms`);
    console.log(`End-to-End Latency: ${metrics.endToEndLatency.toFixed(2)}ms`);

    // Disconnect
    await conversation.disconnect();
    console.log('\n✓ Disconnected successfully');

  } catch (error) {
    console.error('Error:', error);
    await conversation.disconnect();
    process.exit(1);
  }
}

// Run when executed directly (cross-platform: Windows, Unix)
const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && resolve(__filename) === resolve(process.argv[1]);
if (isMain) {
  main().catch(console.error);
}
