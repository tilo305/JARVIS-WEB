/**
 * Unit tests for file-creator — WAV, PDF, image, text blobs and safeFilename.
 */
import { describe, it, expect } from '@jest/globals';
import {
  createWavBlob,
  createPdfBlob,
  createImageBlobFromBase64,
  createTextBlob,
  createWavBlobFromAudioFile,
  isAudioFile,
  safeFilename,
} from '../../public/js/file-creator.js';

describe('file-creator', () => {
  describe('createWavBlob', () => {
    it('should create a WAV blob from Int16Array', () => {
      const pcm = new Int16Array([0, 100, -100, 0]);
      const blob = createWavBlob(pcm, 44100);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('audio/wav');
      expect(blob.size).toBe(44 + 8); // header 44 + 4 samples * 2 bytes
    });

    it('should create a WAV blob from number array', () => {
      const pcm = [0, 100, -100];
      const blob = createWavBlob(pcm, 16000);
      expect(blob.type).toBe('audio/wav');
      expect(blob.size).toBe(44 + 6);
    });
  });

  describe('createPdfBlob', () => {
    it('should create a PDF blob with title and content', async () => {
      const blob = await createPdfBlob({ title: 'Test', content: 'Hello world.' });
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(100);
    });

    it('should handle empty content', async () => {
      const blob = await createPdfBlob({ content: '' });
      expect(blob.type).toBe('application/pdf');
    });
  });

  describe('createImageBlobFromBase64', () => {
    it('should create image blob from raw base64', () => {
      const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const blob = createImageBlobFromBase64(b64, 'image/png');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should parse data URL', () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQ';
      const blob = createImageBlobFromBase64(dataUrl);
      expect(blob.type).toBe('image/jpeg');
    });
  });

  describe('createTextBlob', () => {
    it('should create text blob', () => {
      const blob = createTextBlob('Hello');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
      expect(blob.size).toBe(5);
    });
  });

  describe('isAudioFile', () => {
    it('should return true for audio MIME types', () => {
      expect(isAudioFile({ type: 'audio/mpeg' })).toBe(true);
      expect(isAudioFile({ type: 'audio/wav' })).toBe(true);
      expect(isAudioFile({ type: 'audio/webm' })).toBe(true);
    });
    it('should return false for non-audio', () => {
      expect(isAudioFile({ type: 'image/png' })).toBe(false);
      expect(isAudioFile({ type: 'text/plain' })).toBe(false);
      expect(isAudioFile(null)).toBe(false);
      expect(isAudioFile({})).toBe(false);
    });
  });

  describe('createWavBlobFromAudioFile', () => {
    it('should reject when AudioContext is not available', async () => {
      const win = typeof globalThis !== 'undefined' ? globalThis.window : undefined;
      if (typeof win === 'undefined') return;
      const orig = win.AudioContext;
      win.AudioContext = undefined;
      const file = new File([new Uint8Array(0)], 'empty.mp3', { type: 'audio/mpeg' });
      await expect(createWavBlobFromAudioFile(file)).rejects.toThrow(/AudioContext/);
      win.AudioContext = orig;
    });
  });

  describe('safeFilename', () => {
    it('should add default extension when missing', () => {
      expect(safeFilename('report', '.pdf')).toBe('report.pdf');
    });
    it('should keep existing extension', () => {
      expect(safeFilename('report.pdf', '.pdf')).toBe('report.pdf');
    });
    it('should sanitize unsafe characters', () => {
      expect(safeFilename('a/b:c', '.txt')).not.toMatch(/[/:]/);
    });
    it('should return download + ext for empty name', () => {
      expect(safeFilename('', '.wav')).toBe('download.wav');
    });
  });
});
