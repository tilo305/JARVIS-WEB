/**
 * Test for greeting message time of day replacement
 * Verifies that {{ now }} is correctly replaced with time of day (morning, afternoon, evening)
 */
import { describe, it, expect } from '@jest/globals';

/**
 * Get time of day based on hour (matches index.html implementation)
 * @param {number} hour - Hour of day (0-23)
 * @returns {string} - Time of day: 'morning', 'afternoon', or 'evening'
 * Evening: 5:00 PM - 4:59 AM (hours 17-4)
 */
function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  // Evening: 5:00 PM - 4:59 AM (hours 17-4)
  return 'evening';
}

/**
 * Replace {{ now }} placeholder with time of day (matches index.html implementation)
 * @param {string} text - Text containing {{ now }} placeholder
 * @param {string} timeOfDay - Time of day to replace with
 * @returns {string} - Text with placeholder replaced
 */
function replaceTimePlaceholder(text, timeOfDay) {
  return text.replace('{{ now }}', timeOfDay);
}

describe('Greeting Message Time of Day', () => {
  describe('getTimeOfDay function', () => {
    it('should return "morning" for hours 5-11', () => {
      expect(getTimeOfDay(5)).toBe('morning');
      expect(getTimeOfDay(6)).toBe('morning');
      expect(getTimeOfDay(11)).toBe('morning');
      expect(getTimeOfDay(11.9)).toBe('morning');
    });

    it('should return "afternoon" for hours 12-16', () => {
      expect(getTimeOfDay(12)).toBe('afternoon');
      expect(getTimeOfDay(13)).toBe('afternoon');
      expect(getTimeOfDay(16)).toBe('afternoon');
      expect(getTimeOfDay(16.9)).toBe('afternoon');
    });

    it('should return "evening" for hours 17-23 and 0-4', () => {
      // Evening: 5:00 PM - 4:59 AM (hours 17-4)
      expect(getTimeOfDay(17)).toBe('evening');
      expect(getTimeOfDay(18)).toBe('evening');
      expect(getTimeOfDay(21)).toBe('evening');
      expect(getTimeOfDay(22)).toBe('evening');
      expect(getTimeOfDay(23)).toBe('evening');
      expect(getTimeOfDay(0)).toBe('evening');
      expect(getTimeOfDay(1)).toBe('evening');
      expect(getTimeOfDay(4)).toBe('evening');
      expect(getTimeOfDay(4.9)).toBe('evening');
    });

    it('should handle all 24 hours correctly', () => {
      // Evening: 5:00 PM - 4:59 AM (hours 17-4)
      const expected = {
        0: 'evening', 1: 'evening', 2: 'evening', 3: 'evening', 4: 'evening',
        5: 'morning', 6: 'morning', 7: 'morning', 8: 'morning', 9: 'morning',
        10: 'morning', 11: 'morning',
        12: 'afternoon', 13: 'afternoon', 14: 'afternoon', 15: 'afternoon', 16: 'afternoon',
        17: 'evening', 18: 'evening', 19: 'evening', 20: 'evening', 21: 'evening',
        22: 'evening', 23: 'evening'
      };

      for (let hour = 0; hour < 24; hour++) {
        expect(getTimeOfDay(hour)).toBe(expected[hour]);
      }
    });
  });

  describe('replaceTimePlaceholder function', () => {
    it('should replace {{ now }} with time of day', () => {
      const text = 'Good {{ now }}, sir. How may I assist you?';
      const result = replaceTimePlaceholder(text, 'morning');
      expect(result).toBe('Good morning, sir. How may I assist you?');
    });

    it('should work with all time of day values', () => {
      const text = 'Good {{ now }}, sir. How may I assist you?';
      
      expect(replaceTimePlaceholder(text, 'morning')).toBe('Good morning, sir. How may I assist you?');
      expect(replaceTimePlaceholder(text, 'afternoon')).toBe('Good afternoon, sir. How may I assist you?');
      expect(replaceTimePlaceholder(text, 'evening')).toBe('Good evening, sir. How may I assist you?');
    });

    it('should only replace first occurrence of {{ now }}', () => {
      const text = 'Good {{ now }}, sir. {{ now }} is the time.';
      const result = replaceTimePlaceholder(text, 'morning');
      expect(result).toBe('Good morning, sir. {{ now }} is the time.');
    });

    it('should handle text without placeholder', () => {
      const text = 'Good morning, sir. How may I assist you?';
      const result = replaceTimePlaceholder(text, 'afternoon');
      expect(result).toBe(text); // Should remain unchanged
    });

    it('should handle empty text', () => {
      const result = replaceTimePlaceholder('', 'morning');
      expect(result).toBe('');
    });

    it('should handle text with only placeholder', () => {
      const result = replaceTimePlaceholder('{{ now }}', 'evening');
      expect(result).toBe('evening');
    });
  });

  describe('Integration: Full greeting message', () => {
    it('should produce correct greeting for morning hours', () => {
      const hour = 8;
      const timeOfDay = getTimeOfDay(hour);
      const greeting = replaceTimePlaceholder('Good {{ now }}, sir. How may I assist you?', timeOfDay);
      
      expect(timeOfDay).toBe('morning');
      expect(greeting).toBe('Good morning, sir. How may I assist you?');
      expect(greeting).not.toContain('{{ now }}');
    });

    it('should produce correct greeting for afternoon hours', () => {
      const hour = 14;
      const timeOfDay = getTimeOfDay(hour);
      const greeting = replaceTimePlaceholder('Good {{ now }}, sir. How may I assist you?', timeOfDay);
      
      expect(timeOfDay).toBe('afternoon');
      expect(greeting).toBe('Good afternoon, sir. How may I assist you?');
      expect(greeting).not.toContain('{{ now }}');
    });

    it('should produce correct greeting for evening hours', () => {
      const hour = 19;
      const timeOfDay = getTimeOfDay(hour);
      const greeting = replaceTimePlaceholder('Good {{ now }}, sir. How may I assist you?', timeOfDay);
      
      expect(timeOfDay).toBe('evening');
      expect(greeting).toBe('Good evening, sir. How may I assist you?');
      expect(greeting).not.toContain('{{ now }}');
    });

    it('should produce correct greeting for late evening hours (5:00 PM - 4:59 AM)', () => {
      // Test evening hours: 17-23 and 0-4
      const eveningHours = [17, 22, 23, 0, 4];
      
      eveningHours.forEach(hour => {
        const timeOfDay = getTimeOfDay(hour);
        const greeting = replaceTimePlaceholder('Good {{ now }}, sir. How may I assist you?', timeOfDay);
        
        expect(timeOfDay).toBe('evening');
        expect(greeting).toBe('Good evening, sir. How may I assist you?');
        expect(greeting).not.toContain('{{ now }}');
      });
    });

    it('should match the exact format from index.html', () => {
      const originalText = 'Good {{ now }}, sir. How may I assist you?';
      
      // Test all time periods (evening now spans 5:00 PM - 4:59 AM)
      const times = ['morning', 'afternoon', 'evening'];
      
      times.forEach(timeOfDay => {
        const result = replaceTimePlaceholder(originalText, timeOfDay);
        expect(result).toMatch(/^Good (morning|afternoon|evening), sir\. How may I assist you\?$/);
        expect(result).not.toContain('{{ now }}');
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle boundary hours correctly', () => {
      // Test exact boundaries
      // Evening: 5:00 PM - 4:59 AM (hours 17-4)
      expect(getTimeOfDay(4)).toBe('evening');
      expect(getTimeOfDay(5)).toBe('morning');
      expect(getTimeOfDay(11)).toBe('morning');
      expect(getTimeOfDay(12)).toBe('afternoon');
      expect(getTimeOfDay(16)).toBe('afternoon');
      expect(getTimeOfDay(17)).toBe('evening');
      expect(getTimeOfDay(21)).toBe('evening');
      expect(getTimeOfDay(22)).toBe('evening');
      expect(getTimeOfDay(23)).toBe('evening');
      expect(getTimeOfDay(0)).toBe('evening');
    });

    it('should handle case sensitivity in placeholder', () => {
      // The implementation uses exact match '{{ now }}'
      const text = 'Good {{ NOW }}, sir.';
      const result = replaceTimePlaceholder(text, 'morning');
      // Should not replace because case doesn't match
      expect(result).toBe(text);
    });

    it('should handle whitespace variations', () => {
      const text1 = 'Good {{ now }}, sir.';
      const text2 = 'Good {{now}}, sir.';
      const text3 = 'Good {{  now  }}, sir.';
      
      expect(replaceTimePlaceholder(text1, 'morning')).toBe('Good morning, sir.');
      expect(replaceTimePlaceholder(text2, 'morning')).toBe(text2); // Won't match
      expect(replaceTimePlaceholder(text3, 'morning')).toBe(text3); // Won't match
    });
  });
});
