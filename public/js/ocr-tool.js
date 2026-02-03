/**
 * OCR tool for the multimodal pipeline — extracts text from image attachments
 * using Tesseract.js in the browser. Uses Tesseract best practices for quality:
 * - Image preprocessing: upscale to sufficient resolution, optional grayscale
 *   (see https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html and
 *   Tesseract.js API: "Often, the same image will get much better results if you upscale it")
 * - Page Segmentation Mode (PSM) configurable for layout (default: AUTO)
 * - Automatic rotation (rotateAuto) for skewed photos
 */
'use strict';

/* eslint-disable no-console -- intentional: OCR fallback warnings only */

const IMAGE_MIME_PREFIX = 'image/';

/**
 * Page Segmentation Mode (PSM) values for Tesseract.
 * See https://github.com/tesseract-ocr/tesseract/blob/main/src/ccstruct/publictypes.h
 * and Tesseract.js docs: tessedit_pageseg_mode.
 */
export const OCR_PSM = {
  OSD_ONLY: '0',
  AUTO_OSD: '1',
  AUTO_ONLY: '2',
  /** Fully automatic page segmentation (default for general images). */
  AUTO: '3',
  SINGLE_COLUMN: '4',
  SINGLE_BLOCK_VERT_TEXT: '5',
  SINGLE_BLOCK: '6',
  SINGLE_LINE: '7',
  SINGLE_WORD: '8',
  CIRCLE_WORD: '9',
  SINGLE_CHAR: '10',
  /** Find as much text as possible in no particular order (sparse/scattered text). */
  SPARSE_TEXT: '11',
  SPARSE_TEXT_OSD: '12',
  RAW_LINE: '13',
};

/**
 * Default OCR configuration aligned with Tesseract quality recommendations.
 * Override via runOcrOnImage(..., options) or by mutating OCR_CONFIG.
 */
export const OCR_CONFIG = {
  /** Minimum length of the longer side in pixels (roughly 300 DPI for ~4" docs). */
  minDimension: 1200,
  /** Convert to grayscale before OCR (often improves accuracy). */
  grayscale: true,
  /** Page Segmentation Mode: AUTO = 3 for general photos/documents. */
  psm: OCR_PSM.AUTO,
  /** Enable automatic rotation detection in Tesseract.js. */
  rotateAuto: true,
};

/** Lazy-loaded Tesseract worker */
let tesseractPromise = null;

function loadTesseract() {
  if (tesseractPromise) return tesseractPromise;
  tesseractPromise = import('tesseract.js').then(async (Tesseract) => {
    const worker = await Tesseract.createWorker('eng', 1);
    await worker.setParameters({
      tessedit_pageseg_mode: OCR_CONFIG.psm,
    });
    return worker;
  });
  return tesseractPromise;
}

/**
 * Preprocess image for better OCR: upscale to min dimension and optionally grayscale.
 * Only runs in browser (uses Canvas). Returns original data URL if not in browser or on error.
 * @param {string} dataUrl - data:image/...;base64,...
 * @param {{ minDimension?: number, grayscale?: boolean }} [opts] - Override OCR_CONFIG
 * @returns {Promise<string>} - Data URL (preprocessed or original)
 */
export function preprocessImageForOcr(dataUrl, opts = {}) {
  const minDim = opts.minDimension ?? OCR_CONFIG.minDimension;
  const grayscale = opts.grayscale ?? OCR_CONFIG.grayscale;

  if (typeof document === 'undefined' || !document.createElement) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        let { width, height } = img;
        if (width < 1 || height < 1) {
          resolve(dataUrl);
          return;
        }
        const scale = Math.max(minDim / width, minDim / height, 1);
        if (scale > 1) {
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        if (grayscale) {
          const imageData = ctx.getImageData(0, 0, width, height);
          const d = imageData.data;
          for (let i = 0; i < d.length; i += 4) {
            const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            d[i] = d[i + 1] = d[i + 2] = Math.round(y);
          }
          ctx.putImageData(imageData, 0, 0);
        }
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[JARVIS OCR] preprocess failed', err?.message || err);
        }
        resolve(dataUrl);
      }
    };
    img.src = dataUrl;
  });
}

/**
 * Check if a MIME type is an image we can run OCR on.
 * @param {string} mimeType - e.g. 'image/png', 'image/jpeg'
 * @returns {boolean}
 */
export function isOcrSupportedType(mimeType) {
  if (!mimeType || typeof mimeType !== 'string') return false;
  const t = mimeType.toLowerCase();
  if (!t.startsWith(IMAGE_MIME_PREFIX)) return false;
  return /^image\/(png|jpe?g|gif|webp|bmp)$/.test(t);
}

/**
 * Run OCR on a base64-encoded image. Uses preprocessing and PSM/rotateAuto from config.
 * @param {string} base64Data - Raw base64 string (no data URL prefix)
 * @param {string} mimeType - e.g. 'image/png'
 * @param {{ psm?: string, rotateAuto?: boolean, skipPreprocess?: boolean }} [options] - Override PSM or skip preprocessing
 * @returns {Promise<string>} - Extracted text, or '' if not an image or OCR failed
 */
export async function runOcrOnImage(base64Data, mimeType, options = {}) {
  if (!base64Data || !isOcrSupportedType(mimeType)) return '';
  try {
    const worker = await loadTesseract();
    let dataUrl = `data:${mimeType};base64,${base64Data}`;
    if (!options.skipPreprocess) {
      dataUrl = await preprocessImageForOcr(dataUrl);
    }
    const recognizeOpts = {
      tessedit_pageseg_mode: options.psm ?? OCR_CONFIG.psm,
      rotateAuto: options.rotateAuto ?? OCR_CONFIG.rotateAuto,
    };
    const { data } = await worker.recognize(dataUrl, recognizeOpts);
    const text = (data?.text || '').trim();
    return text;
  } catch (err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[JARVIS OCR]', err?.message || err);
    }
    return '';
  }
}

/**
 * Run OCR on each image in an array of attachment payload items.
 * Mutates each image attachment to add ocrText when supported.
 * @param {Array<{ name: string, type: string, size: number, data?: string }>} attachments - From filesToAttachmentPayload
 * @param {{ psm?: string, skipPreprocess?: boolean }} [options] - Passed to runOcrOnImage per image
 * @returns {Promise<void>}
 */
export async function addOcrToAttachments(attachments, options = {}) {
  if (!Array.isArray(attachments)) return;
  await Promise.all(
    attachments.map(async (a) => {
      if (!a || !isOcrSupportedType(a.type) || !a.data) return;
      try {
        a.ocrText = await runOcrOnImage(a.data, a.type, options);
      } catch (err) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[JARVIS OCR] addOcrToAttachments', err?.message || err);
        }
        a.ocrText = '';
      }
    })
  );
}
