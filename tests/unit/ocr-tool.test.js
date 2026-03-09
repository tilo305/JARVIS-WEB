/**
 * Unit tests for OCR tool (multimodal) — isOcrSupportedType, config, preprocessing, addOcrToAttachments.
 */
import { describe, it, expect } from '@jest/globals';
import {
  isOcrSupportedType,
  addOcrToAttachments,
  OCR_PSM,
  OCR_CONFIG,
  preprocessImageForOcr,
} from '../../public/js/ocr-tool.js';

describe('ocr-tool', () => {
  describe('OCR_PSM', () => {
    it('should expose PSM constants as strings', () => {
      expect(OCR_PSM.AUTO).toBe('3');
      expect(OCR_PSM.SINGLE_BLOCK).toBe('6');
      expect(OCR_PSM.SPARSE_TEXT).toBe('11');
    });
  });

  describe('OCR_CONFIG', () => {
    it('should have minDimension, grayscale, psm, rotateAuto, borderPx', () => {
      expect(OCR_CONFIG).toHaveProperty('minDimension');
      expect(OCR_CONFIG).toHaveProperty('grayscale');
      expect(OCR_CONFIG).toHaveProperty('psm');
      expect(OCR_CONFIG).toHaveProperty('rotateAuto');
      expect(OCR_CONFIG).toHaveProperty('borderPx');
      expect(OCR_CONFIG.minDimension).toBe(1200);
      expect(OCR_CONFIG.psm).toBe(OCR_PSM.AUTO);
      expect(typeof OCR_CONFIG.borderPx).toBe('number');
      expect(OCR_CONFIG.borderPx).toBeGreaterThanOrEqual(0);
    });
  });

  describe('preprocessImageForOcr', () => {
    it('should resolve with same dataUrl when not in browser (no document)', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      const out = await preprocessImageForOcr(dataUrl);
      expect(out).toBe(dataUrl);
    });

    it('should resolve with same dataUrl when not in browser with borderPx option', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      const out = await preprocessImageForOcr(dataUrl, { borderPx: 10 });
      expect(out).toBe(dataUrl);
    });
  });

  describe('isOcrSupportedType', () => {
    it('should return true for common image types', () => {
      expect(isOcrSupportedType('image/png')).toBe(true);
      expect(isOcrSupportedType('image/jpeg')).toBe(true);
      expect(isOcrSupportedType('image/jpg')).toBe(true);
      expect(isOcrSupportedType('image/webp')).toBe(true);
      expect(isOcrSupportedType('image/gif')).toBe(true);
      expect(isOcrSupportedType('image/bmp')).toBe(true);
    });

    it('should return false for non-image types', () => {
      expect(isOcrSupportedType('application/pdf')).toBe(false);
      expect(isOcrSupportedType('text/plain')).toBe(false);
      expect(isOcrSupportedType('')).toBe(false);
    });

    it('should return false for invalid input', () => {
      expect(isOcrSupportedType(null)).toBe(false);
      expect(isOcrSupportedType(undefined)).toBe(false);
    });
  });

  describe('addOcrToAttachments', () => {
    it('should not throw when given empty or non-array', async () => {
      await addOcrToAttachments([]);
      await addOcrToAttachments(null);
      await addOcrToAttachments(undefined);
    });

    it('should leave non-image attachments unchanged', async () => {
      const attachments = [
        { name: 'doc.pdf', type: 'application/pdf', size: 100 },
      ];
      await addOcrToAttachments(attachments);
      expect(attachments[0]).not.toHaveProperty('ocrText');
    });

    it('should skip attachments without data (no OCR run)', async () => {
      const attachments = [
        { name: 'img.png', type: 'image/png', size: 100 },
      ];
      await addOcrToAttachments(attachments);
      expect(attachments[0]).not.toHaveProperty('ocrText');
    });

    it('should accept sparseText and other options without throwing', async () => {
      const attachments = [
        { name: 'img.png', type: 'image/png', size: 100 },
      ];
      await addOcrToAttachments(attachments, { sparseText: true, borderPx: 10 });
      expect(attachments[0]).not.toHaveProperty('ocrText');
    });
  });
});
