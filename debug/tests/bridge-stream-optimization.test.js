/**
 * Test for bridge streamTextChunks optimization
 * Verifies that TTS connection is checked once before sending all chunks
 */

const { readFileSync } = require('fs');
const { join } = require('path');

const bridgePath = join(__dirname, '../../public/js/cartesia-audio-bridge.js');
const bridgeSource = readFileSync(bridgePath, 'utf-8');

describe('Bridge streamTextChunks Optimization', () => {
  it('should check TTS connection once before sending all chunks', () => {
    // Find the streamTextChunks function
    const streamTextChunksIndex = bridgeSource.indexOf('async streamTextChunks');
    expect(streamTextChunksIndex).toBeGreaterThan(-1);
    
    // Extract the function body (from opening brace to closing brace)
    let braceCount = 0;
    let startIndex = bridgeSource.indexOf('{', streamTextChunksIndex);
    let endIndex = startIndex;
    
    for (let i = startIndex; i < bridgeSource.length; i++) {
      if (bridgeSource[i] === '{') braceCount++;
      if (bridgeSource[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    const streamTextChunksCode = bridgeSource.substring(startIndex, endIndex + 1);
    
    // Should check connection before the map/loop
    expect(streamTextChunksCode).toMatch(/if\s*\(!\s*this\.ttsWs/);
    expect(streamTextChunksCode).toMatch(/readyState\s*!==\s*WebSocket\.OPEN/);
    expect(streamTextChunksCode).toMatch(/await\s+this\.connectTTS\(\)/);
    
    // Should send chunks in parallel (Promise.all)
    expect(streamTextChunksCode).toMatch(/Promise\.all\(/);
    
    // Should use map to create promises
    expect(streamTextChunksCode).toMatch(/\.map\(/);
  });

  it('should handle connection check before parallel sends', () => {
    // Find the streamTextChunks function
    const streamTextChunksIndex = bridgeSource.indexOf('async streamTextChunks');
    let braceCount = 0;
    let startIndex = bridgeSource.indexOf('{', streamTextChunksIndex);
    let endIndex = startIndex;
    
    for (let i = startIndex; i < bridgeSource.length; i++) {
      if (bridgeSource[i] === '{') braceCount++;
      if (bridgeSource[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    const streamTextChunksCode = bridgeSource.substring(startIndex, endIndex + 1);
    
    // Find the position of connection check vs map
    const connectionCheckIndex = streamTextChunksCode.indexOf('if (!this.ttsWs');
    const mapIndex = streamTextChunksCode.indexOf('.map(');
    
    // Connection check should come before map
    expect(connectionCheckIndex).toBeGreaterThan(-1);
    expect(mapIndex).toBeGreaterThan(-1);
    expect(connectionCheckIndex).toBeLessThan(mapIndex);
  });

  it('should use continue flag correctly for continuations', () => {
    const streamTextChunksIndex = bridgeSource.indexOf('async streamTextChunks');
    let braceCount = 0;
    let startIndex = bridgeSource.indexOf('{', streamTextChunksIndex);
    let endIndex = startIndex;
    
    for (let i = startIndex; i < bridgeSource.length; i++) {
      if (bridgeSource[i] === '{') braceCount++;
      if (bridgeSource[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    const streamTextChunksCode = bridgeSource.substring(startIndex, endIndex + 1);
    
    // Should set isContinue based on index
    expect(streamTextChunksCode).toMatch(/isContinue\s*=\s*i\s*<\s*chunks\.length\s*-\s*1/);
    
    // Should pass isContinue to speakText
    expect(streamTextChunksCode).toMatch(/speakText\([^,]+,\s*ctxId,\s*isContinue\)/);
  });
});
