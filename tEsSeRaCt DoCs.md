# tEsSeRaCt DoCs

Comprehensive research on [Tesseract OCR](https://tesseract-ocr.github.io/) for the JARVIS-WEB project — issues, fixes, and integration notes.

---

## Project context

JARVIS-WEB uses **Tesseract.js** (v5.x) in the browser for **client-side OCR** on image attachments. Text is extracted via `public/js/ocr-tool.js`, preprocessed (upscale, grayscale), then sent as `ocrText` on attachments to the n8n webhook. The underlying engine is a WebAssembly port of [Tesseract](https://github.com/tesseract-ocr/tesseract); official Tesseract docs apply to behavior and quality.

**Key links:**
- **Tesseract docs (official):** https://tesseract-ocr.github.io/
- **User manual (5.x):** https://tesseract-ocr.github.io/tessdoc/
- **Tesseract.js (browser):** https://github.com/naptha/tesseract.js — wraps tesseract.js-core (WASM build of Tesseract)

---

## Official documentation index

| Resource | URL | Use in JARVIS-WEB |
|----------|-----|-------------------|
| User Manual (5.x) | [tessdoc](https://tesseract-ocr.github.io/tessdoc/) | General behavior, PSM, quality |
| Improve quality | [ImproveQuality.html](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html) | Preprocessing (we already follow: upscale, grayscale, PSM) |
| FAQ | [FAQ.html](https://tesseract-ocr.github.io/tessdoc/FAQ.html) | Common issues, speed, multi-image |
| Common errors | [Common-Errors-and-Resolutions.html](https://tesseract-ocr.github.io/tessdoc/Common-Errors-and-Resolutions.html) | API/locale issues (less relevant in browser) |
| Command line / PSM | [Command-Line-Usage.html](https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html) | PSM values and behavior |
| Input formats | [InputFormats.html](https://tesseract-ocr.github.io/tessdoc/InputFormats.html) | Supported image types (PNG, JPEG, etc.) |
| Source (Doxygen) | [tessapi/5.x](https://tesseract-ocr.github.io/tessapi/5.x/) | C++ API reference |
| Publications / research | [docs](https://tesseract-ocr.github.io/docs/) | Papers, tutorials |

---

## Issues and fixes relevant to this project

### 1. Image quality (already applied in `ocr-tool.js`)

- **DPI:** Tesseract works best at **≥300 DPI**. We upscale so the longer side is at least `minDimension` (1200 px) — see [ImproveQuality.html](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html) (Rescaling).
- **Grayscale:** Often improves accuracy; we use `OCR_CONFIG.grayscale: true`.
- **Rotation/skew:** We use Tesseract.js `rotateAuto: true`; docs recommend horizontal text lines ([ImproveQuality.html](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html) – Rotation/Deskewing).
- **Dark text on light background:** Tesseract 4+/5 expects dark text on light background; inverted images can be problematic ([ImproveQuality](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html) – Inverting images).

### 2. Page Segmentation Mode (PSM)

We use **PSM 3 (AUTO)** by default. Full list and when to use:

- `0` OSD only, `1` Auto+OSD, `2` Auto no OSD, **`3` Fully automatic (default)** ✓  
- `4` Single column, `5` Single block vertical, `6` Single block, `7` Single line, `8` Single word, `9` Circle word, `10` Single char  
- **`11` Sparse text** — “find as much text as possible in no particular order” (e.g. signs, labels in photos).  
- `12` Sparse+OSD, `13` Raw line  

For scattered text (signs, labels in chat images), consider `options.psm: OCR_PSM.SPARSE_TEXT` ('11') when calling `runOcrOnImage` or `addOcrToAttachments`. See [ImproveQuality.html – Page segmentation](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html) and [Command-Line-Usage](https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html).

### 3. Multiple images / same worker

FAQ: [“Inconsistent results when same TessBaseAPI is used for multiple images”](https://tesseract-ocr.github.io/tessdoc/FAQ.html). Fix: disable adaptive learning (`classify_enable_learning=0`) or clear adaptive data between images. Tesseract.js reuses one worker; if we ever see drift across images, we can try setting this via `worker.setParameters({ classify_enable_learning: '0' })`.

### 4. Speed

- Use “fast” integer models when available (tessdata_fast); Tesseract.js uses its own traineddata.
- Single-threaded is often better when processing many images (one process per image); in the browser we already run one worker and queue images.
- FAQ: [Can I increase speed of OCR?](https://tesseract-ocr.github.io/tessdoc/FAQ.html)

### 5. Input formats

[InputFormats](https://tesseract-ocr.github.io/tessdoc/InputFormats.html): PNG, JPEG, TIFF, BMP, PNM, WebP (non-animated), GIF (first frame). **No PDF input** (PDF is output only). Our `isOcrSupportedType()` allows png, jpeg, gif, webp, bmp — aligned with Tesseract.

### 6. Language data (traineddata)

- Tesseract.js **downloads language data (e.g. `eng`) automatically**; no need to ship `eng.traineddata` in the repo (see CLEANUP-SUMMARY.md).  
- Official data: [tessdata](https://github.com/tesseract-ocr/tessdata), [tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast), [tessdata_best](https://github.com/tesseract-ocr/tessdata_best). For multiple languages, use `-l eng+deu` (CLI) or equivalent in Tesseract.js.

### 7. Handwriting and barcodes

- **Handwriting:** Tesseract is for **printed text**; handwriting support is poor ([FAQ](https://tesseract-ocr.github.io/tessdoc/FAQ.html)).  
- **Barcodes:** Not supported; use a dedicated barcode library.

### 8. Tables

Tables are known to be problematic without custom layout/segmentation ([ImproveQuality – Tables](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)). For form-like or table images, consider preprocessing or different PSM (e.g. try 6); no change in our code unless we target tables specifically.

### 9. Transparency / alpha channel

Tesseract 4+ removes alpha by blending with white. Transparent or subtitle-like images can give bad results; preprocess (e.g. flatten to white background) if needed ([ImproveQuality – Transparency](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)).

### 10. Borders

- **Missing border:** Adding a small (e.g. 10 px) white border can help.  
- **Large borders / single word on big image:** Can cause “empty page”; crop to text region with small margin.  
See [ImproveQuality – Borders](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html).

---

## Our implementation summary

| Aspect | Location | Notes |
|--------|----------|--------|
| Preprocessing | `public/js/ocr-tool.js` `preprocessImageForOcr()` | Upscale to `minDimension` (1200), optional grayscale, **flatten alpha to white**, optional **borderPx** (default 0) |
| PSM | `OCR_PSM`, `OCR_CONFIG.psm` | Default PSM 3 (AUTO); **`options.sparseText: true`** or `psm: OCR_PSM.SPARSE_TEXT` for signs/scattered text |
| Rotation | `OCR_CONFIG.rotateAuto` | Enabled by default |
| Worker | `loadTesseract()` | Single lazy worker, `eng`, PSM + **`classify_enable_learning: '0'`** for consistent multi-image results |
| Attachments | `addOcrToAttachments()` | Adds `ocrText`; options: **sparseText**, **borderPx**, psm, skipPreprocess, rotateAuto |
| Tests | `tests/unit/ocr-tool.test.js` | PSM, config (incl. borderPx), preprocessing (incl. borderPx opts), `isOcrSupportedType`, addOcrToAttachments (incl. sparseText/borderPx options) |

Implemented: for “signs/labels in a photo” flows, allow callers to pass `psm: OCR_PSM.SPARSE_TEXT` (11) in options.

---

## Where to get help

- **Tesseract (engine):** [FAQ](https://tesseract-ocr.github.io/tessdoc/FAQ.html), [Common Errors](https://tesseract-ocr.github.io/tessdoc/Common-Errors-and-Resolutions.html), [GitHub issues](https://github.com/tesseract-ocr/tesseract/issues), [User forum](https://groups.google.com/group/tesseract-ocr).  
- **Tesseract.js (browser):** [naptha/tesseract.js](https://github.com/naptha/tesseract.js), [tesseract.js-core](https://github.com/naptha/tesseract.js-core) (WASM build).

---

*Last updated from https://tesseract-ocr.github.io/ and tessdoc (5.x) for JARVIS-WEB multimodal OCR.*
