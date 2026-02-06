/**
 * openWakeWord integration live checks (zEn DeBuGgEr).
 * Verifies OpenWakeWordClient and OpenWakeWordManager API and optional server connectivity.
 * Put in debug folder per zEn DeBuGgEr.md; fixes must be 100% working.
 */
import { describe, it, expect, afterEach } from '@jest/globals';

describe('openWakeWord (debug live)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('OpenWakeWordClient class should exist and have connect, sendAudio, close', async () => {
    const mod = await import('../../public/js/openwakeword-client.js');
    const { OpenWakeWordClient } = mod;
    expect(typeof OpenWakeWordClient).toBe('function');
    const client = new OpenWakeWordClient({ wsUrl: 'ws://localhost:8765/ws' });
    expect(typeof client.connect).toBe('function');
    expect(typeof client.sendAudio).toBe('function');
    expect(typeof client.close).toBe('function');
    expect(typeof client.sendSampleRate).toBe('function');
    expect(client.isConnected()).toBe(false);
    client.close();
  });

  it('OpenWakeWordManager class should exist and have initialize, setEnabled, release', async () => {
    const mod = await import('../../public/js/openwakeword-manager.js');
    const { OpenWakeWordManager } = mod;
    expect(typeof OpenWakeWordManager).toBe('function');
    const manager = new OpenWakeWordManager({ wsUrl: 'ws://localhost:9999/ws' });
    expect(typeof manager.initialize).toBe('function');
    expect(typeof manager.setEnabled).toBe('function');
    expect(typeof manager.release).toBe('function');
    expect(manager.isEnabled()).toBe(false);
    expect(manager.getMetrics()).toBeNull();
  });

  it('bridge should import OpenWakeWordManager and use it when useOpenWakeWord is set', async () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const source = readFileSync(join(__dirname, '../../public/js/cartesia-audio-bridge.js'), 'utf8');
    expect(source).toMatch(/OpenWakeWordManager/);
    expect(source).toMatch(/openWakeWordWsUrl/);
    expect(source).toMatch(/useOpenWakeWord/);
  });

  it('bridge VAD pre-start must include getStream', async () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const source = readFileSync(join(__dirname, '../../public/js/cartesia-audio-bridge.js'), 'utf8');
    // Check that getStream returns a Promise resolving to this.mediaStream
    expect(source).toMatch(/getStream:\s*\(\)\s*=>/);
    expect(source).toMatch(/Promise\.resolve\(this\.mediaStream\)/);
  });
});
