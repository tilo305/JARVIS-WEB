/**
 * File creator — generate and download audio (WAV), PDF, image, and text files.
 * Audio WAV can be created from uploaded audio (File/Blob) or from raw PCM.
 */
'use strict';

const AUDIO_MIME_PREFIX = 'audio/';

/**
 * Whether a File or object with type is an audio file the browser can decode.
 * @param {File|{ type?: string }} file
 * @returns {boolean}
 */
export function isAudioFile(file) {
  if (!file || typeof file !== 'object') return false;
  const type = (file.type || '').toLowerCase();
  return type.startsWith(AUDIO_MIME_PREFIX);
}

/**
 * Create a WAV blob from an uploaded audio File or Blob (e.g. MP3, WebM, OGG).
 * Uses Web Audio API decodeAudioData; works in browser only.
 * @param {File|Blob} file - Audio file to decode
 * @returns {Promise<Blob>} - audio/wav (mono, 16-bit, original sample rate)
 */
export async function createWavBlobFromAudioFile(file) {
  if (typeof window === 'undefined' || !window.AudioContext) {
    throw new Error('createWavBlobFromAudioFile requires a browser with AudioContext');
  }
  const arrayBuffer = await (file instanceof Blob ? file.arrayBuffer() : file.arrayBuffer());
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  await ctx.close();
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const channel0 = buffer.getChannelData(0);
  const float32 = numChannels === 1 ? channel0 : new Float32Array(length);
  if (numChannels > 1) {
    for (let i = 0; i < length; i++) {
      let sum = channel0[i];
      for (let c = 1; c < numChannels; c++) sum += buffer.getChannelData(c)[i];
      float32[i] = sum / numChannels;
    }
  }
  const int16 = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return createWavBlob(int16, sampleRate);
}

/**
 * Create a WAV blob from 16-bit mono PCM.
 * @param {Int16Array|number[]} pcmSamples - PCM s16le samples (mono)
 * @param {number} sampleRate - e.g. 44100
 * @returns {Blob} - audio/wav
 */
export function createWavBlob(pcmSamples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataLength = (Array.isArray(pcmSamples) ? pcmSamples.length : pcmSamples.byteLength / 2) * bytesPerSample;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = dataLength;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataLength);
  const view = new DataView(buffer);
  let offset = 0;

  function writeU32(v) {
    view.setUint32(offset, v, true);
    offset += 4;
  }
  function writeU16(v) {
    view.setUint16(offset, v, true);
    offset += 2;
  }

  // RIFF header
  view.setUint8(offset++, 0x52); // R
  view.setUint8(offset++, 0x49); // I
  view.setUint8(offset++, 0x46); // F
  view.setUint8(offset++, 0x46); // F
  writeU32(36 + dataSize);
  view.setUint8(offset++, 0x57); // W
  view.setUint8(offset++, 0x41); // A
  view.setUint8(offset++, 0x56); // V
  view.setUint8(offset++, 0x45); // E
  // fmt chunk
  view.setUint8(offset++, 0x66); // f
  view.setUint8(offset++, 0x6d); // m
  view.setUint8(offset++, 0x74); // t
  view.setUint8(offset++, 0x20); // space
  writeU32(16);
  writeU16(1); // PCM
  writeU16(numChannels);
  writeU32(sampleRate);
  writeU32(byteRate);
  writeU16(blockAlign);
  writeU16(bitsPerSample);
  // data chunk
  view.setUint8(offset++, 0x64); // d
  view.setUint8(offset++, 0x61); // a
  view.setUint8(offset++, 0x74); // t
  view.setUint8(offset++, 0x61); // a
  writeU32(dataSize);

  const out = new Int16Array(buffer, headerSize, dataLength / 2);
  if (Array.isArray(pcmSamples)) {
    for (let i = 0; i < pcmSamples.length; i++) out[i] = pcmSamples[i];
  } else {
    out.set(new Int16Array(pcmSamples));
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Create a PDF blob from title and text content (multi-line supported).
 * @param {{ title?: string, content: string }} options
 * @returns {Promise<Blob>} - application/pdf
 */
export async function createPdfBlob(options = {}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const title = (options.title || 'Document').trim();
  const content = (options.content || '').trim();
  const margin = 20;
  const lineHeight = 7;
  let y = 20;

  if (title) {
    doc.setFontSize(16);
    doc.text(title, margin, y);
    y += lineHeight * 2;
  }
  doc.setFontSize(11);
  const lines = content.split(/\r?\n/);
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, maxWidth);
    for (const part of wrapped) {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(part, margin, y);
      y += lineHeight;
    }
  }
  return doc.output('blob');
}

/**
 * Create an image blob from base64 data URL or raw base64 string.
 * @param {string} data - data URL (data:image/png;base64,...) or raw base64
 * @param {string} [mime='image/png'] - MIME type when data is raw base64
 * @returns {Blob}
 */
export function createImageBlobFromBase64(data, mime = 'image/png') {
  let base64 = data;
  if (data.indexOf('base64,') !== -1) {
    base64 = data.split(',')[1] || data;
    const mimeMatch = data.match(/^data:([^;]+);/);
    if (mimeMatch) mime = mimeMatch[1];
  }
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Create a text file blob.
 * @param {string} content
 * @param {string} [mime='text/plain']
 * @returns {Blob}
 */
export function createTextBlob(content, mime = 'text/plain') {
  return new Blob([content || ''], { type: mime });
}

/**
 * Trigger a download of a Blob with the given filename.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  if (typeof window === 'undefined' || !window.URL) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Normalize filename: ensure extension, safe characters.
 * @param {string} name
 * @param {string} defaultExt - e.g. '.wav'
 * @returns {string}
 */
export function safeFilename(name, defaultExt = '') {
  if (!name || typeof name !== 'string') return 'download' + defaultExt;
  const base = name.replace(/[^\w.\- ]/g, '_').trim() || 'download';
  return base.includes('.') ? base : base + defaultExt;
}
