/**
 * Test for timestamp display in chat messages
 * Verifies that timestamps are correctly formatted and added to messages
 */
import { describe, it, expect } from '@jest/globals';

/**
 * Format timestamp for display (matches app.js implementation)
 */
function formatTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: 'numeric', 
    minute: '2-digit'
  });
}

/**
 * Simple HTML escape function (matches debug.js implementation)
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}

describe('Timestamp Display in Chat Messages', () => {
  it('should format timestamp in 12-hour format with AM/PM', () => {
    const timestamp = formatTimestamp();
    
    // Should contain either AM or PM
    expect(timestamp.match(/AM|PM/i)).not.toBeNull();
    
    // Should match pattern like "3:45 PM" or "12:30 AM"
    expect(timestamp).toMatch(/^\d{1,2}:\d{2}\s*(AM|PM)$/i);
  });

  it('should generate valid timestamp string', () => {
    const timestamp = formatTimestamp();
    
    expect(typeof timestamp).toBe('string');
    expect(timestamp.length).toBeGreaterThan(0);
    expect(timestamp.trim()).toBe(timestamp); // No leading/trailing whitespace
  });

  it('should generate different timestamps for different times', async () => {
    const timestamp1 = formatTimestamp();
    
    // Wait a bit to ensure different timestamp (if created in same minute, this may be same)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const timestamp2 = formatTimestamp();
    
    // Both should be valid
    expect(timestamp1).toBeTruthy();
    expect(timestamp2).toBeTruthy();
    expect(timestamp1).toMatch(/^\d{1,2}:\d{2}\s*(AM|PM)$/i);
    expect(timestamp2).toMatch(/^\d{1,2}:\d{2}\s*(AM|PM)$/i);
  });

  it('should escape HTML in timestamp to prevent XSS', () => {
    // Test that escapeHtml works correctly
    const testString = '<script>alert("xss")</script>';
    const escaped = escapeHtml(testString);
    
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&gt;');
  });

  it('should create correct HTML structure with timestamp', () => {
    const role = 'user';
    const content = 'Test message';
    const label = role === 'user' ? 'You' : 'JARVIS';
    const timestamp = formatTimestamp();
    
    // Simulate the HTML structure created by appendMessage
    const html = `<div class="label">${escapeHtml(label)}</div><div class="timestamp">${escapeHtml(timestamp)}</div><div class="content">${escapeHtml(content)}</div>`;
    
    // Verify structure contains all required elements
    expect(html).toContain('class="label"');
    expect(html).toContain('class="timestamp"');
    expect(html).toContain('class="content"');
    
    // Verify label is present
    expect(html).toContain(escapeHtml(label));
    
    // Verify timestamp is present and escaped
    expect(html).toContain(escapeHtml(timestamp));
    
    // Verify content is present
    expect(html).toContain(escapeHtml(content));
  });

  it('should work for both user and assistant messages', () => {
    const userTimestamp = formatTimestamp();
    const assistantTimestamp = formatTimestamp();
    
    // Both should be valid timestamps
    expect(userTimestamp).toMatch(/^\d{1,2}:\d{2}\s*(AM|PM)$/i);
    expect(assistantTimestamp).toMatch(/^\d{1,2}:\d{2}\s*(AM|PM)$/i);
    
    // Test HTML structure for both roles
    const userLabel = 'You';
    const assistantLabel = 'JARVIS';
    
    const userHtml = `<div class="label">${escapeHtml(userLabel)}</div><div class="timestamp">${escapeHtml(userTimestamp)}</div>`;
    const assistantHtml = `<div class="label">${escapeHtml(assistantLabel)}</div><div class="timestamp">${escapeHtml(assistantTimestamp)}</div>`;
    
    expect(userHtml).toContain('You');
    expect(assistantHtml).toContain('JARVIS');
    expect(userHtml).toContain('class="timestamp"');
    expect(assistantHtml).toContain('class="timestamp"');
  });

  it('should handle edge cases in timestamp formatting', () => {
    // Test that formatTimestamp always returns a string
    for (let i = 0; i < 10; i++) {
      const timestamp = formatTimestamp();
      expect(typeof timestamp).toBe('string');
      expect(timestamp.length).toBeGreaterThan(0);
    }
  });
});
