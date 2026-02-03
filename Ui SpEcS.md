# JARVIS UI Specifications

Complete UI codebase with all colors, styling, and details for the JARVIS chat interface.

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Complete HTML Structure](#complete-html-structure)
4. [Complete CSS Styles](#complete-css-styles)
5. [Component Specifications](#component-specifications)
6. [Animations](#animations)
7. [Layout & Dimensions](#layout--dimensions)

---

## Color Palette

### CSS Variables (from `:root`)
```css
--bg-deep: #0a0a0f;              /* Deep black background */
--bg-panel: #0f0f15;             /* Panel background */
--bg-input: #1a1a22;             /* Input field background */
--border: #2a2a35;               /* Border color */

/* Iron Man Gold - Hot Rod Gold */
--gold: #FFB800;                  /* Primary gold */
--gold-bright: #FFD700;          /* Bright gold */
--gold-glow: #FFED4E;            /* Glowing gold */
--gold-dim: #FF8C00;             /* Dimmed gold */

/* Iron Man Red - Hot Rod Red */
--iron-red: #C41E3A;             /* Primary red */
--iron-red-bright: #DC143C;      /* Bright red */
--iron-red-glow: #FF1744;        /* Glowing red */
--iron-red-dim: #8B0000;         /* Dimmed red */

/* Accent Colors */
--red: #FF1744;                  /* Accent red */
--text: #F5F5F5;                 /* Primary text */
--text-muted: #B0B0B0;           /* Muted text */
--user-msg-bg: rgba(196, 30, 58, 0.15);      /* User message background */
--assistant-msg-bg: rgba(255, 184, 0, 0.12); /* Assistant message background */

/* Border Radius */
--radius: 20px;                  /* Standard border radius */
--radius-sm: 12px;               /* Small border radius */

/* Easing Functions */
--ease-out: cubic-bezier(0, 0, 0.58, 1);
--ease-in-out: cubic-bezier(0.42, 0, 0.58, 1);
--ease-material: cubic-bezier(0.4, 0, 0.2, 1);
```

### Color Usage Reference
- **Gold (#FFB800, #FFD700)**: Primary accent, buttons, borders, assistant messages
- **Red (#C41E3A, #DC143C)**: User messages, logo, status indicators, recording state
- **Background**: Deep black (#0a0a0f) with gradient overlays
- **Text**: White (#F5F5F5) primary, gray (#B0B0B0) muted

---

## Typography

### Font Families
- **Primary**: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Heading (JARVIS)**: `'Orbitron', sans-serif` (Google Fonts)

### Font Sizes
- **Heading (h1)**: `1.25rem` (20px)
- **Message content**: `0.9375rem` (15px)
- **Message label**: `0.7rem` (11.2px)
- **Status text**: `0.75rem` (12px)
- **File name**: `0.8rem` (12.8px)
- **Attachment button**: `0.8125rem` (13px)

### Font Weights
- **Heading**: `700` (bold)
- **Message label**: `600` (semi-bold)
- **Body text**: `400` (normal)

---

## Complete HTML Structure

### Full HTML Document (Exact Copy)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JARVIS — Voice &amp; Chat</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='%23C41E3A' opacity='0.3'/><circle cx='16' cy='16' r='10' fill='none' stroke='%23FFB800' stroke-width='2'/><circle cx='16' cy='16' r='4' fill='%23DC143C'/></svg>" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet">
  <!-- Modern UI v2.0 - Enhanced Iron Man Theme with Glassmorphism -->
  <!-- [Complete CSS styles are in the CSS section below] -->
</head>
<body>
  <div class="chat-interface">
    <header class="header">
      <div class="logo" aria-hidden="true"></div>
      <h1>JARVIS</h1>
      <span class="status" id="status">Ready</span>
      <div class="header-actions">
        <button type="button" class="btn-icon btn-export" id="btnExportPdf" title="Export chat to PDF" aria-label="Export chat to PDF">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M10 13h4M10 17h4M8 9h.01"/>
          </svg>
        </button>
      </div>
    </header>

    <main class="chat-container" id="chatContainer" role="log" aria-live="polite">
      <div class="message assistant">
        <div class="label">JARVIS</div>
        <div class="content">Good evening. I am JARVIS. You can type a message, use the microphone to speak, or attach a file. How may I assist you?</div>
      </div>
    </main>

    <div class="input-row">
      <button type="button" class="btn-icon" id="btnPaperclip" title="Attach file" aria-label="Attach file">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>
      <input type="file" id="fileInput" multiple tabindex="-1">
      <div class="input-wrap">
        <textarea id="textInput" placeholder="Type or speak..." rows="1" aria-label="Message"></textarea>
      </div>
      <button type="button" class="btn-send" id="btnSend" title="Send" aria-label="Send message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m22 2-7 20-4-9-9-4Z"/>
          <path d="M22 2 11 13"/>
        </svg>
      </button>
      <button type="button" class="btn-icon" id="btnMic" title="Click to start or stop voice" aria-label="Microphone — click to talk" aria-pressed="false">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="2" width="6" height="11" rx="3" ry="3"/>
          <path d="M5 10v2a7 7 0 0 0 14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </button>
    </div>
  </div>

  <script>
    window.JARVIS_CONFIG = window.JARVIS_CONFIG || {};
    // Set your Cartesia API key here (or use VITE_CARTESIA_API_KEY in .env file):
    // window.JARVIS_CONFIG.apiKey = 'sk_car_your_api_key_here';
    // window.JARVIS_CONFIG.voiceId = 'your_voice_id_here'; // Optional
    
    // Enable debug: ?debug=1 in URL, or set window.JARVIS_DEBUG = true
    if (/[?&]debug=1/.test(location.search) || /[?&]debug=true/.test(location.search)) {
      window.JARVIS_DEBUG = true;
    }
  </script>
  <script type="module" src="./js/app.js"></script>
</body>
</html>
```

### HTML Element Details

#### Favicon (SVG Data URI)
- **Format**: SVG embedded as data URI
- **Colors**: 
  - Outer circle: `#C41E3A` (iron-red) at 30% opacity
  - Middle circle: `#FFB800` (gold) stroke, 2px width
  - Inner circle: `#DC143C` (iron-red-bright) fill
- **ViewBox**: `0 0 32 32`

#### Font Imports
- **Google Fonts**: Orbitron (weights: 400, 600, 700) and Inter (weights: 400, 500, 600)
- **Display**: `swap` (ensures text is visible during font load)

#### Element IDs (Required for JavaScript)
- `status` - Status indicator text
- `chatContainer` - Main chat message container
- `btnExportPdf` - Export PDF button
- `btnPaperclip` - File attachment button
- `fileInput` - Hidden file input element
- `textInput` - Text input textarea
- `btnSend` - Send message button
- `btnMic` - Microphone button

#### ARIA Attributes
- `aria-hidden="true"` - Logo (decorative)
- `aria-label` - All buttons have descriptive labels
- `aria-pressed` - Microphone button (toggles between "true" and "false")
- `role="log"` - Chat container (for screen readers)
- `aria-live="polite"` - Chat container (announces new messages)

#### CSS Classes Used in HTML
- `.chat-interface` - Main container
- `.header` - Header section
- `.logo` - Circular logo element
- `.status` - Status indicator (base class)
- `.header-actions` - Header button container
- `.btn-icon` - Icon button base class
- `.btn-export` - Export button (additional class, no specific CSS)
- `.chat-container` - Message container
- `.message` - Message wrapper
- `.assistant` - Assistant message modifier
- `.user` - User message modifier (added via JavaScript)
- `.label` - Message sender label
- `.content` - Message content
- `.input-row` - Input area container
- `.input-wrap` - Input field wrapper
- `.btn-send` - Send button

#### Dynamic Classes (Added/Removed via JavaScript)
- `.status.listening` - Applied when listening to voice
- `.status.speaking` - Applied when speaking/TTS active
- `.status.status-misfire` - Applied on VAD misfire
- `.status.error` - Applied on errors
- `.btn-icon.active` - Applied when button is active
- `.btn-icon.active.recording` - Applied when microphone is recording
- `.message.user` - Applied to user messages (created dynamically)
- `.message.assistant` - Applied to assistant messages
- `.attachments` - Container for message attachments (created dynamically)
- `.attachment-audio` - Audio attachment wrapper (created dynamically)
- `.btn-attachment` - Download button for attachments (created dynamically)
- `.file-name` - File name display (created dynamically)

---

## Complete CSS Styles

```css
:root {
  --bg-deep: #0a0a0f;
  --bg-panel: #0f0f15;
  --bg-input: #1a1a22;
  --border: #2a2a35;
  /* Iron Man Gold - Hot Rod Gold */
  --gold: #FFB800;
  --gold-bright: #FFD700;
  --gold-glow: #FFED4E;
  --gold-dim: #FF8C00;
  /* Iron Man Red - Hot Rod Red */
  --iron-red: #C41E3A;
  --iron-red-bright: #DC143C;
  --iron-red-glow: #FF1744;
  --iron-red-dim: #8B0000;
  /* Accent Colors */
  --red: #FF1744;
  --text: #F5F5F5;
  --text-muted: #B0B0B0;
  --user-msg-bg: rgba(196, 30, 58, 0.15);
  --assistant-msg-bg: rgba(255, 184, 0, 0.12);
  --radius: 20px;
  --radius-sm: 12px;
  /* Modern easing functions */
  --ease-out: cubic-bezier(0, 0, 0.58, 1);
  --ease-in-out: cubic-bezier(0.42, 0, 0.58, 1);
  --ease-material: cubic-bezier(0.4, 0, 0.2, 1);
}

* { 
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-deep);
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(196, 30, 58, 0.2) 0%, transparent 60%),
    radial-gradient(circle at 80% 70%, rgba(255, 184, 0, 0.25) 0%, transparent 60%),
    radial-gradient(circle at 50% 50%, rgba(255, 184, 0, 0.15) 0%, transparent 70%),
    linear-gradient(135deg, rgba(196, 30, 58, 0.12) 0%, rgba(255, 184, 0, 0.1) 50%, rgba(196, 30, 58, 0.08) 100%);
  color: var(--text);
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: 
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(196, 30, 58, 0.05) 2px, rgba(196, 30, 58, 0.05) 4px),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 184, 0, 0.05) 2px, rgba(255, 184, 0, 0.05) 4px),
    repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(255, 184, 0, 0.03) 1px, rgba(255, 184, 0, 0.03) 2px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
}

body::after {
  content: '';
  position: fixed;
  inset: 0;
  background: 
    radial-gradient(ellipse at 30% 40%, rgba(196, 30, 58, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(255, 184, 0, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(255, 184, 0, 0.04) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
  animation: backgroundPulse 8s ease-in-out infinite;
}

@keyframes backgroundPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

.chat-interface {
  width: 700px;
  height: 600px;
  display: flex;
  flex-direction: column;
  background: rgba(15, 15, 21, 0.7);
  background-image: 
    linear-gradient(135deg, rgba(196, 30, 58, 0.15) 0%, rgba(255, 184, 0, 0.12) 50%, rgba(196, 30, 58, 0.1) 100%),
    radial-gradient(circle at top left, rgba(196, 30, 58, 0.2) 0%, transparent 50%),
    radial-gradient(circle at bottom right, rgba(255, 184, 0, 0.18) 0%, transparent 50%);
  border: none;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.8),
    0 0 0 2px rgba(196, 30, 58, 0.3),
    0 0 80px rgba(196, 30, 58, 0.3),
    0 0 120px rgba(255, 184, 0, 0.2),
    0 0 100px rgba(196, 30, 58, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.12),
    inset 0 -2px 4px rgba(255, 184, 0, 0.15);
  backdrop-filter: blur(25px) saturate(200%);
  -webkit-backdrop-filter: blur(25px) saturate(200%);
  position: relative;
  z-index: 1;
}

.chat-interface::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius);
  padding: 3px;
  background: rgba(255, 184, 0, 0.3);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: -1;
}

.chat-interface::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 184, 0, 0.3);
  pointer-events: none;
  box-shadow: 
    0 0 10px rgba(255, 184, 0, 0.2);
}

.header {
  flex-shrink: 0;
  padding: 1rem 1.5rem;
  border-bottom: 2px solid;
  border-image: linear-gradient(90deg, transparent, var(--iron-red), var(--gold), var(--iron-red-bright), var(--gold), var(--iron-red), transparent) 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(15, 15, 21, 0.6);
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  position: relative;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 30px rgba(196, 30, 58, 0.2),
    0 0 20px rgba(255, 184, 0, 0.15);
}

.header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    var(--iron-red) 20%, 
    var(--gold) 40%, 
    var(--iron-red-bright) 50%, 
    var(--gold) 60%, 
    var(--iron-red) 80%, 
    transparent
  );
  box-shadow: 
    0 0 20px var(--iron-red), 
    0 0 35px var(--gold);
  animation: borderGlow 3s ease-in-out infinite;
}

@keyframes borderGlow {
  0%, 100% { 
    opacity: 0.8;
    box-shadow: 
      0 0 20px var(--iron-red), 
      0 0 35px var(--gold);
  }
  50% { 
    opacity: 1;
    box-shadow: 
      0 0 30px var(--iron-red), 
      0 0 50px var(--gold),
      0 0 40px var(--iron-red-bright);
  }
}

.header .logo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, var(--iron-red-bright), var(--gold-bright), var(--iron-red), var(--gold));
  box-shadow: 
    0 0 40px rgba(196, 30, 58, 0.9),
    0 0 80px rgba(196, 30, 58, 0.6),
    0 0 120px rgba(255, 184, 0, 0.5),
    0 0 100px rgba(255, 184, 0, 0.4),
    inset 0 0 30px rgba(255, 184, 0, 0.6),
    inset 0 0 50px rgba(196, 30, 58, 0.4);
  position: relative;
  transition: transform var(--ease-material) 300ms, box-shadow var(--ease-material) 300ms;
  border: 2px solid rgba(255, 184, 0, 0.5);
}

.header .logo::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--iron-red), var(--gold), var(--iron-red-bright), var(--gold), var(--iron-red));
  opacity: 0.5;
  animation: logoRotate 3s linear infinite;
  z-index: -1;
}

@keyframes logoRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: no-preference) {
  .header .logo {
    animation: logoGlow 2s ease-in-out infinite;
  }
}

@keyframes logoGlow {
  0%, 100% { 
    box-shadow: 
      0 0 40px rgba(196, 30, 58, 0.9),
      0 0 80px rgba(196, 30, 58, 0.6),
      0 0 120px rgba(255, 184, 0, 0.5),
      0 0 100px rgba(255, 184, 0, 0.4),
      inset 0 0 30px rgba(255, 184, 0, 0.6);
    transform: scale(1);
  }
  50% { 
    box-shadow: 
      0 0 70px rgba(196, 30, 58, 1),
      0 0 140px rgba(196, 30, 58, 0.8),
      0 0 200px rgba(255, 184, 0, 0.7),
      0 0 160px rgba(255, 184, 0, 0.6),
      inset 0 0 40px rgba(255, 184, 0, 0.8),
      inset 0 0 25px rgba(196, 30, 58, 0.5);
    transform: scale(1.08);
  }
}

.header h1 {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 30%, var(--iron-red) 50%, var(--gold) 70%, var(--gold-bright) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: 
    drop-shadow(0 0 20px rgba(255, 184, 0, 0.9)) 
    drop-shadow(0 0 30px rgba(196, 30, 58, 0.8));
  animation: textShimmer 2.5s ease-in-out infinite;
  text-transform: uppercase;
  position: relative;
}

.header h1::before {
  content: 'JARVIS';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--iron-red-bright) 0%, var(--iron-red) 30%, var(--gold) 50%, var(--iron-red) 70%, var(--gold-bright) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  animation: textShimmerAlt 2.5s ease-in-out infinite;
}

@keyframes textShimmer {
  0%, 100% { 
    filter: 
      drop-shadow(0 0 20px rgba(255, 184, 0, 0.9)) 
      drop-shadow(0 0 30px rgba(196, 30, 58, 0.8));
    background-position: 0% 50%;
  }
  50% { 
    filter: 
      drop-shadow(0 0 28px rgba(255, 184, 0, 1)) 
      drop-shadow(0 0 45px rgba(196, 30, 58, 1))
      drop-shadow(0 0 60px rgba(255, 184, 0, 0.6));
    background-position: 100% 50%;
  }
}

@keyframes textShimmerAlt {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.3; }
}

.header .status {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  background: rgba(42, 52, 65, 0.6);
  border: 1px solid rgba(196, 30, 58, 0.3);
  transition: all var(--ease-material) 300ms;
  position: relative;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.header .status::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
  margin-left: -14px;
  transition: opacity var(--ease-material) 300ms;
  box-shadow: 0 0 8px currentColor;
}

.header .status.listening { 
  color: var(--iron-red-bright);
  background: rgba(196, 30, 58, 0.2);
  border-color: var(--iron-red);
  box-shadow: 
    0 0 30px rgba(196, 30, 58, 0.6),
    0 0 60px rgba(196, 30, 58, 0.4),
    inset 0 0 15px rgba(196, 30, 58, 0.2);
}

.header .status.listening::before {
  opacity: 1;
  background: var(--iron-red-bright);
  box-shadow: 
    0 0 18px var(--iron-red),
    0 0 36px var(--iron-red),
    0 0 54px var(--iron-red);
  animation: statusPulse 1.2s var(--ease-in-out) infinite;
}

.header .status.speaking { 
  color: var(--gold-bright);
  background: rgba(255, 184, 0, 0.18);
  border-color: var(--gold);
  box-shadow: 
    0 0 25px rgba(255, 184, 0, 0.5),
    0 0 50px rgba(255, 184, 0, 0.3),
    0 0 30px rgba(196, 30, 58, 0.2),
    inset 0 0 12px rgba(255, 184, 0, 0.15);
}

.header .status.speaking::before {
  opacity: 1;
  background: var(--gold-bright);
  box-shadow: 
    0 0 15px var(--gold),
    0 0 30px var(--gold),
    0 0 45px var(--gold),
    0 0 20px var(--iron-red);
  animation: statusPulse 1.2s var(--ease-in-out) infinite;
}

.header .status.status-misfire { 
  color: var(--gold-dim);
  background: rgba(139, 115, 85, 0.1);
}

.header .status.error { 
  color: var(--red);
  background: rgba(230, 57, 70, 0.1);
  box-shadow: 0 0 12px rgba(230, 57, 70, 0.2);
}

.header .status.error::before {
  opacity: 1;
}

@keyframes statusPulse {
  0%, 100% { opacity: 0.6; transform: translateY(-50%) scale(1); }
  50% { opacity: 1; transform: translateY(-50%) scale(1.2); }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.header-actions .btn-icon {
  width: 40px;
  height: 40px;
}

.chat-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 1.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  scroll-behavior: smooth;
}

.chat-container::-webkit-scrollbar {
  width: 6px;
}

.chat-container::-webkit-scrollbar-track {
  background: transparent;
}

.chat-container::-webkit-scrollbar-thumb {
  background: rgba(139, 115, 85, 0.3);
  border-radius: 3px;
  transition: background var(--ease-material) 200ms;
}

.chat-container::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 162, 39, 0.5);
}

.message {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  font-size: 0.9375rem;
  line-height: 1.45;
  position: relative;
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
}

@media (prefers-reduced-motion: no-preference) {
  .message { 
    animation: fadeIn 300ms var(--ease-out);
  }
}

@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(8px) scale(0.98);
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1);
  }
}

.message.user {
  align-self: flex-end;
  background: linear-gradient(135deg, rgba(196, 30, 58, 0.25), rgba(196, 30, 58, 0.15));
  border: 1.5px solid var(--iron-red);
  box-shadow: 
    0 4px 14px rgba(196, 30, 58, 0.3),
    0 0 30px rgba(196, 30, 58, 0.25),
    inset 0 1px 0 rgba(220, 20, 60, 0.3);
}

.message.assistant {
  align-self: flex-start;
  background: linear-gradient(135deg, rgba(255, 184, 0, 0.2), rgba(255, 184, 0, 0.1), rgba(196, 30, 58, 0.08));
  border: 1.5px solid var(--gold);
  box-shadow: 
    0 4px 14px rgba(255, 184, 0, 0.25),
    0 0 25px rgba(255, 184, 0, 0.2),
    0 0 15px rgba(196, 30, 58, 0.15),
    inset 0 1px 0 rgba(255, 215, 0, 0.25);
}

.message .label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.message.assistant .label { 
  color: var(--gold-dim);
  text-shadow: 0 0 8px rgba(201, 162, 39, 0.3);
}

.message.user .label { 
  color: var(--iron-red-bright);
  text-shadow: 0 0 8px rgba(196, 30, 58, 0.5);
}

.message .content { 
  word-break: break-word;
}

.message .attachments {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.message .attachments img {
  max-width: 120px;
  max-height: 120px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform var(--ease-material) 200ms;
}

.message .attachments img:hover {
  transform: scale(1.05);
}

.message .attachments .file-name {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.message .attachments .attachment-audio {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.message .attachments .btn-attachment {
  font-size: 0.8125rem;
  padding: 0.625rem 1rem;
  border: 2px solid var(--gold);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 40%, var(--iron-red) 60%, var(--gold) 100%);
  background-size: 200% 200%;
  color: #0a0a0f;
  cursor: pointer;
  transition: all var(--ease-material) 300ms;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.message .attachments .btn-attachment::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity var(--ease-material) 300ms;
  z-index: 0;
}

.message .attachments .btn-attachment > * {
  position: relative;
  z-index: 1;
}

.message .attachments .btn-attachment:hover {
  background-position: 100% 50%;
  border-color: var(--gold-bright);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 
    0 0 30px rgba(255, 184, 0, 0.6),
    0 0 50px rgba(255, 184, 0, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.message .attachments .btn-attachment:hover::before {
  opacity: 1;
}

.message .attachments .btn-attachment:active {
  transform: translateY(0) scale(0.98);
}

.input-row {
  flex-shrink: 0;
  padding: 1rem 1.5rem 1.5rem;
  background: rgba(13, 17, 23, 0.5);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 2px solid rgba(255, 184, 0, 0.3);
  border-radius: var(--radius);
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  position: relative;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.5rem 0.75rem;
  min-height: 44px;
  transition: all var(--ease-material) 200ms;
  position: relative;
}

.input-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius);
  padding: 1px;
  background: linear-gradient(135deg, rgba(196, 30, 58, 0.3), rgba(255, 184, 0, 0.3));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity var(--ease-material) 200ms;
  pointer-events: none;
}

.input-wrap:focus-within {
  border-color: var(--gold-dim);
  box-shadow: 
    0 0 0 2px rgba(201, 162, 39, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.2);
}

.input-wrap:focus-within::before {
  opacity: 1;
}

.input-wrap textarea {
  flex: 1;
  border: none;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 0.9375rem;
  resize: none;
  min-height: 24px;
  max-height: 120px;
  transition: color var(--ease-material) 200ms;
}

.input-wrap textarea::placeholder { 
  color: var(--text-muted);
  transition: opacity var(--ease-material) 200ms;
}

.input-wrap textarea:focus::placeholder {
  opacity: 0.5;
}

.input-wrap textarea:focus { 
  outline: none;
}

.input-wrap textarea:focus-visible { 
  outline: 2px solid var(--gold); 
  outline-offset: 2px;
}

.btn-icon {
  width: 48px;
  height: 48px;
  border: 2px solid var(--gold);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 40%, var(--iron-red) 60%, var(--gold) 100%);
  background-size: 200% 200%;
  color: #0a0a0f;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--ease-material) 300ms;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 16px rgba(255, 184, 0, 0.5),
    0 0 30px rgba(255, 184, 0, 0.4),
    0 0 20px rgba(196, 30, 58, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.btn-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity var(--ease-material) 300ms;
  z-index: 1;
}

.btn-icon > * {
  position: relative;
  z-index: 2;
}

.btn-icon svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  transition: transform var(--ease-material) 300ms, filter var(--ease-material) 300ms;
}

.btn-icon:hover svg {
  transform: scale(1.1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.btn-icon:active svg {
  transform: scale(0.95);
}

.btn-icon:hover:not(:disabled) {
  background-position: 100% 50%;
  transform: translateY(-3px) scale(1.06);
  border-color: var(--gold-bright);
  box-shadow: 
    0 0 50px rgba(255, 184, 0, 0.9),
    0 0 80px rgba(255, 184, 0, 0.6),
    0 0 40px rgba(196, 30, 58, 0.5),
    0 6px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
}

.btn-icon:hover:not(:disabled)::before {
  opacity: 1;
}

.btn-icon:active:not(:disabled) {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 
    0 2px 12px rgba(255, 184, 0, 0.4),
    0 0 20px rgba(255, 184, 0, 0.3),
    0 0 15px rgba(196, 30, 58, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.btn-icon:focus-visible { 
  outline: 2px solid var(--gold); 
  outline-offset: 3px;
  border-color: var(--gold);
  box-shadow: 
    0 0 0 4px rgba(255, 184, 0, 0.2),
    0 4px 16px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(255, 184, 0, 0.3);
}

.btn-icon:disabled { 
  opacity: 0.4; 
  cursor: not-allowed;
  transform: none;
  filter: grayscale(0.5);
}

.btn-icon.active { 
  background-position: 100% 50%;
  border-color: var(--gold-bright);
  box-shadow: 
    0 0 30px rgba(255, 184, 0, 0.7),
    0 0 60px rgba(255, 184, 0, 0.5),
    0 0 40px rgba(196, 30, 58, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.btn-icon.active.recording { 
  background: linear-gradient(135deg, var(--red) 0%, var(--iron-red-bright) 40%, var(--red) 60%, var(--iron-red-bright) 100%);
  background-size: 200% 200%;
  border-color: var(--red);
  box-shadow: 
    0 0 30px rgba(230, 57, 70, 0.7),
    0 0 60px rgba(230, 57, 70, 0.5),
    0 0 40px rgba(196, 30, 58, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

@media (prefers-reduced-motion: no-preference) {
  .btn-icon.active.recording { 
    animation: recordingPulse 1.2s var(--ease-in-out) infinite;
  }
}

@keyframes pulse {
  50% { opacity: 0.7; }
}

@keyframes recordingPulse {
  0%, 100% { 
    box-shadow: 
      0 0 20px rgba(230, 57, 70, 0.5),
      0 0 40px rgba(230, 57, 70, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
  50% { 
    box-shadow: 
      0 0 30px rgba(230, 57, 70, 0.7),
      0 0 60px rgba(230, 57, 70, 0.5),
      0 0 80px rgba(230, 57, 70, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
}

.btn-send {
  width: 52px;
  height: 52px;
  border: 2px solid var(--gold);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 40%, var(--iron-red) 60%, var(--gold) 100%);
  background-size: 200% 200%;
  color: #0a0a0f;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--ease-material) 300ms;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 16px rgba(255, 184, 0, 0.5),
    0 0 30px rgba(255, 184, 0, 0.4),
    0 0 20px rgba(196, 30, 58, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.btn-send::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity var(--ease-material) 300ms;
  z-index: 1;
}

.btn-send::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--gold-bright), var(--gold), var(--iron-red-bright), var(--gold), var(--gold-bright));
  background-size: 300% 300%;
  opacity: 0;
  transition: opacity var(--ease-material) 300ms;
  z-index: -1;
  filter: blur(8px);
  animation: gradientShift 3s ease infinite;
}

.btn-send > * {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.btn-send svg {
  width: 100%;
  height: 100%;
  transition: transform var(--ease-material) 300ms, filter var(--ease-material) 300ms;
}

.btn-send:hover:not(:disabled) svg {
  transform: scale(1.1) rotate(-5deg);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.btn-send:active:not(:disabled) svg {
  transform: scale(0.95) rotate(0deg);
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.btn-send:focus-visible { 
  outline: 2px solid var(--gold-bright); 
  outline-offset: 3px;
  box-shadow: 
    0 0 0 4px rgba(255, 184, 0, 0.3),
    0 4px 16px rgba(255, 184, 0, 0.5),
    0 0 30px rgba(255, 184, 0, 0.4),
    0 0 20px rgba(196, 30, 58, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.btn-send:hover:not(:disabled) {
  box-shadow: 
    0 0 50px rgba(255, 184, 0, 0.9),
    0 0 80px rgba(255, 184, 0, 0.6),
    0 0 40px rgba(196, 30, 58, 0.5),
    0 6px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  transform: translateY(-3px) scale(1.06);
  border-color: var(--gold-bright);
  background-position: 100% 50%;
}

.btn-send:hover:not(:disabled)::before {
  opacity: 1;
}

.btn-send:hover:not(:disabled)::after {
  opacity: 0.6;
}

.btn-send:active:not(:disabled) {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 
    0 2px 12px rgba(255, 184, 0, 0.4),
    0 0 20px rgba(255, 184, 0, 0.3),
    0 0 15px rgba(196, 30, 58, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.btn-send:disabled { 
  opacity: 0.5; 
  cursor: not-allowed;
  transform: none;
  filter: grayscale(0.4);
  box-shadow: 
    0 2px 8px rgba(255, 184, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

#fileInput { 
  display: none;
}
```

---

## Component Specifications

### Chat Interface Container
- **Width**: `700px`
- **Height**: `600px`
- **Background**: `rgba(15, 15, 21, 0.7)` with gradient overlays
- **Border Radius**: `20px`
- **Backdrop Filter**: `blur(25px) saturate(200%)`
- **Box Shadow**: Multiple layered shadows for depth and glow effect

### Header
- **Padding**: `1rem 1.5rem` (16px 24px)
- **Border**: 2px gradient border (red to gold)
- **Background**: `rgba(15, 15, 21, 0.6)` with backdrop blur
- **Logo**: 36px × 36px circular gradient with rotating border
- **Title**: Orbitron font, gradient text with shimmer animation

### Status Indicator
- **Font Size**: `0.75rem` (12px)
- **Padding**: `0.25rem 0.75rem`
- **Border Radius**: `6px`
- **States**:
  - Default: Gray text, muted background
  - Listening: Red text, red glow, pulsing dot
  - Speaking: Gold text, gold glow, pulsing dot
  - Error: Red text, red background

### Messages
- **Max Width**: `85%` of container
- **Padding**: `0.75rem 1rem` (12px 16px)
- **Border Radius**: `20px`
- **Font Size**: `0.9375rem` (15px)
- **Line Height**: `1.45`
- **User Messages**: 
  - Right-aligned
  - Red gradient background
  - Red border and glow
- **Assistant Messages**: 
  - Left-aligned
  - Gold gradient background
  - Gold border and glow

### Input Row
- **Padding**: `1rem 1.5rem 1.5rem`
- **Background**: `rgba(13, 17, 23, 0.5)` with backdrop blur
- **Border**: `2px solid rgba(255, 184, 0, 0.3)`
- **Border Radius**: `20px`

### Input Field
- **Background**: `#1a1a22`
- **Border**: `1px solid #2a2a35`
- **Border Radius**: `20px`
- **Padding**: `0.5rem 0.75rem`
- **Min Height**: `44px`
- **Max Height**: `120px` (textarea)
- **Placeholder Color**: `#B0B0B0`

### Buttons

#### Icon Buttons (Paperclip, Mic, Export)
- **Size**: `48px × 48px` (header actions: `40px × 40px`)
- **Border**: `2px solid #FFB800`
- **Border Radius**: `12px`
- **Background**: Gold-to-red gradient
- **Hover**: Scale up, enhanced glow, translate up
- **Active State**: Red gradient when recording

#### Send Button
- **Size**: `52px × 52px`
- **Border**: `2px solid #FFB800`
- **Border Radius**: `12px`
- **Background**: Gold-to-red gradient
- **Hover**: Scale up, rotate icon, enhanced glow
- **Disabled**: Grayscale, reduced opacity

---

## Animations

### Background Pulse
- **Duration**: `8s`
- **Easing**: `ease-in-out`
- **Effect**: Opacity pulses from 0.4 to 0.7

### Border Glow
- **Duration**: `3s`
- **Easing**: `ease-in-out`
- **Effect**: Header border glow intensity pulses

### Logo Rotate
- **Duration**: `3s`
- **Easing**: `linear`
- **Effect**: Continuous 360° rotation of conic gradient border

### Logo Glow
- **Duration**: `2s`
- **Easing**: `ease-in-out`
- **Effect**: Logo scale and glow intensity pulse

### Text Shimmer
- **Duration**: `2.5s`
- **Easing**: `ease-in-out`
- **Effect**: Gradient position shifts, glow intensity changes

### Status Pulse
- **Duration**: `1.2s`
- **Easing**: `cubic-bezier(0.42, 0, 0.58, 1)`
- **Effect**: Status dot scale and opacity pulse

### Recording Pulse
- **Duration**: `1.2s`
- **Easing**: `cubic-bezier(0.42, 0, 0.58, 1)`
- **Effect**: Recording button glow intensity pulses

### Fade In (Messages)
- **Duration**: `300ms`
- **Easing**: `cubic-bezier(0, 0, 0.58, 1)`
- **Effect**: Message fades in with slight upward translation and scale

### Gradient Shift
- **Duration**: `3s`
- **Easing**: `ease`
- **Effect**: Continuous gradient position animation

---

## Layout & Dimensions

### Overall Layout
- **Body**: Flexbox, centered, full viewport height
- **Chat Interface**: Fixed size `700px × 600px`, centered
- **Structure**: Flex column (header, chat container, input row)

### Spacing
- **Gap between messages**: `0.75rem` (12px)
- **Gap in input row**: `0.5rem` (8px)
- **Gap in header**: `0.75rem` (12px)
- **Padding (standard)**: `1rem 1.5rem` (16px 24px)

### Scrollbar
- **Width**: `6px`
- **Thumb Color**: `rgba(139, 115, 85, 0.3)`
- **Thumb Hover**: `rgba(201, 162, 39, 0.5)`
- **Border Radius**: `3px`

### Responsive Considerations
- Animations respect `prefers-reduced-motion`
- Fixed dimensions (not responsive by default)
- Can be made responsive by changing width/height to percentages or viewport units

---

## SVG Icons

### Paperclip Icon (Attachment Button)
- **ViewBox**: `0 0 24 24`
- **Stroke Width**: `1.75`
- **Size**: `20px × 20px`
- **Stroke**: `currentColor` (inherits button color)
- **Stroke Linecap**: `round`
- **Stroke Linejoin**: `round`
- **Path Data**: `m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48`
- **Full SVG**:
```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
</svg>
```

### Send Icon (Paper Airplane - Send Button)
- **ViewBox**: `0 0 24 24`
- **Stroke Width**: `2`
- **Size**: `20px × 20px`
- **Stroke**: `currentColor` (inherits button color)
- **Stroke Linecap**: `round`
- **Stroke Linejoin**: `round`
- **Path Data**: 
  - Path 1: `m22 2-7 20-4-9-9-4Z`
  - Path 2: `M22 2 11 13`
- **Full SVG**:
```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m22 2-7 20-4-9-9-4Z"/>
  <path d="M22 2 11 13"/>
</svg>
```

### Microphone Icon (Microphone Button)
- **ViewBox**: `0 0 24 24`
- **Stroke Width**: `1.75`
- **Size**: `20px × 20px`
- **Stroke**: `currentColor` (inherits button color)
- **Stroke Linecap**: `round`
- **Stroke Linejoin**: `round`
- **Elements**:
  - Rectangle: `x="9" y="2" width="6" height="11" rx="3" ry="3"` (mic body)
  - Path: `M5 10v2a7 7 0 0 0 14 0v-2"` (sound waves)
  - Line 1: `x1="12" y1="19" x2="12" y2="23"` (stand)
  - Line 2: `x1="8" y1="23" x2="16" y2="23"` (base)
- **Full SVG**:
```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="2" width="6" height="11" rx="3" ry="3"/>
  <path d="M5 10v2a7 7 0 0 0 14 0v-2"/>
  <line x1="12" y1="19" x2="12" y2="23"/>
  <line x1="8" y1="23" x2="16" y2="23"/>
</svg>
```

### Export PDF Icon (Export Button in Header)
- **ViewBox**: `0 0 24 24`
- **Stroke Width**: `1.75`
- **Size**: `18px × 18px` (smaller than other icons)
- **Stroke**: `currentColor` (inherits button color)
- **Stroke Linecap**: `round`
- **Stroke Linejoin**: `round`
- **Elements**:
  - Path 1: `M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"` (document outline)
  - Polyline: `14 2 14 8 20 8"` (fold corner)
  - Path 2: `M10 13h4M10 17h4M8 9h.01"` (text lines)
- **Full SVG**:
```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
  <polyline points="14 2 14 8 20 8"/>
  <path d="M10 13h4M10 17h4M8 9h.01"/>
</svg>
```

### Icon Styling
All icons inherit `currentColor` from their parent button, which is `#0a0a0f` (dark text on gold/red gradient background).

**Icon Filters Applied:**
- `.btn-icon svg`: `filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))`
- `.btn-icon:hover svg`: `filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))`
- `.btn-send > *`: `filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))`
- `.btn-send:hover:not(:disabled) svg`: `filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))`

**Icon Transforms:**
- `.btn-icon:hover svg`: `transform: scale(1.1)`
- `.btn-icon:active svg`: `transform: scale(0.95)`
- `.btn-send:hover:not(:disabled) svg`: `transform: scale(1.1) rotate(-5deg)`
- `.btn-send:active:not(:disabled) svg`: `transform: scale(0.95) rotate(0deg)`

---

## Complete CSS Class Reference

### All CSS Classes Defined

#### Layout Classes
- `.chat-interface` - Main container (700px × 600px)
- `.header` - Header section with logo, title, status
- `.header-actions` - Container for header buttons
- `.chat-container` - Scrollable message container
- `.input-row` - Input area container
- `.input-wrap` - Text input wrapper

#### Component Classes
- `.logo` - Circular logo element (36px × 36px)
- `.header h1` - JARVIS title with gradient text
- `.status` - Status indicator base class
- `.message` - Message wrapper base class
- `.message.user` - User message (right-aligned, red theme)
- `.message.assistant` - Assistant message (left-aligned, gold theme)
- `.label` - Message sender label
- `.content` - Message text content
- `.attachments` - Attachment container (created dynamically)
- `.attachment-audio` - Audio attachment wrapper (created dynamically)
- `.file-name` - File name display (created dynamically)
- `.btn-attachment` - Download button for attachments (created dynamically)

#### Button Classes
- `.btn-icon` - Icon button base class (48px × 48px, or 40px in header)
- `.btn-export` - Export PDF button (additional class, inherits `.btn-icon` styles)
- `.btn-send` - Send button (52px × 52px)

#### State Classes (Applied via JavaScript)
- `.status.listening` - Red glow, pulsing animation
- `.status.speaking` - Gold glow, pulsing animation
- `.status.error` - Red error styling
- `.status.status-misfire` - Dimmed gold for VAD misfire
- `.btn-icon.active` - Enhanced glow effect
- `.btn-icon.active.recording` - Red gradient, pulsing animation

#### Pseudo-elements
- `body::before` - Grid pattern overlay
- `body::after` - Radial gradient overlay with pulse animation
- `.chat-interface::before` - Top border glow
- `.chat-interface::after` - Border gradient mask
- `.header::after` - Animated border glow
- `.header .logo::before` - Rotating conic gradient border
- `.header .status::before` - Status indicator dot
- `.input-wrap::before` - Focus border gradient
- `.btn-icon::before` - Hover shine effect
- `.btn-send::before` - Hover shine effect
- `.btn-send::after` - Blurred gradient glow
- `.message .attachments .btn-attachment::before` - Hover shine effect

#### Pseudo-classes
- `:hover` - Hover states for buttons, images, inputs
- `:active` - Active/pressed states
- `:focus` / `:focus-visible` - Focus states with gold outline
- `:focus-within` - Input wrapper focus state
- `:disabled` - Disabled button states
- `::placeholder` - Textarea placeholder styling

#### Media Queries
- `@media (prefers-reduced-motion: no-preference)` - Animation enable/disable

### CSS Classes Without Specific Styles
- `.btn-export` - No additional CSS, inherits `.btn-icon` styles (used for semantic identification)

### CSS Selectors Breakdown

#### Universal Selector
- `*` - `box-sizing: border-box`

#### Element Selectors
- `body` - Main page styling with background gradients
- `textarea` - Input field styling (within `.input-wrap`)

#### ID Selectors
- `#fileInput` - Hidden file input (`display: none`)

#### Attribute Selectors
- None used

#### Combinators
- `.header .logo` - Logo within header
- `.header h1` - H1 within header
- `.header .status` - Status within header
- `.header-actions .btn-icon` - Icon buttons within header actions
- `.message.user` - User message variant
- `.message.assistant` - Assistant message variant
- `.message .label` - Label within message
- `.message .content` - Content within message
- `.message .attachments` - Attachments within message
- `.message .attachments img` - Images within attachments
- `.message .attachments .file-name` - File name within attachments
- `.message .attachments .attachment-audio` - Audio wrapper within attachments
- `.message .attachments .btn-attachment` - Download button within attachments
- `.input-wrap textarea` - Textarea within input wrapper

#### Scrollbar Styling
- `.chat-container::-webkit-scrollbar` - Scrollbar width
- `.chat-container::-webkit-scrollbar-track` - Scrollbar track
- `.chat-container::-webkit-scrollbar-thumb` - Scrollbar thumb
- `.chat-container::-webkit-scrollbar-thumb:hover` - Scrollbar thumb hover

---

## Additional Notes

### Glassmorphism Effects
- Heavy use of `backdrop-filter: blur()` for glass-like transparency
- Multiple layered backgrounds for depth
- Gradient overlays for color accents
- `backdrop-filter: blur(25px) saturate(200%)` on main interface
- `backdrop-filter: blur(30px) saturate(200%)` on header
- `backdrop-filter: blur(24px) saturate(180%)` on input row
- `backdrop-filter: blur(16px) saturate(150%)` on messages
- `backdrop-filter: blur(10px)` on status indicator

### Accessibility
- ARIA labels on all interactive elements
- Focus-visible states with gold outline (`outline: 2px solid var(--gold)`)
- Semantic HTML structure (`<header>`, `<main>`, `<button>`)
- Keyboard navigation support (Enter to send, Tab navigation)
- Screen reader support (`role="log"`, `aria-live="polite"`)
- ARIA pressed state for toggle buttons (`aria-pressed`)

### Browser Compatibility
- WebKit prefixes for backdrop-filter (`-webkit-backdrop-filter`)
- WebKit prefixes for mask-composite (`-webkit-mask-composite`)
- Modern CSS features (backdrop-filter, mask-composite, CSS custom properties)
- Graceful degradation for older browsers (fallback to solid colors)

### Performance
- CSS animations use `transform` and `opacity` for GPU acceleration
- Reduced motion support via media queries (`@media (prefers-reduced-motion: no-preference)`)
- Efficient gradient animations (background-position instead of recreating gradients)
- Hardware-accelerated transforms (`translateY`, `scale`, `rotate`)

### CSS Specificity Notes
- Most styles use class selectors (specificity: 0,1,0)
- Pseudo-classes add specificity (0,2,0 for `.btn-icon:hover`)
- Combined classes increase specificity (0,2,0 for `.btn-icon.active.recording`)
- No inline styles used (all via classes)
- No `!important` declarations used

### Z-Index Layers
- `body::before` and `body::after`: `z-index: 0` (background)
- `.chat-interface`: `z-index: 1` (main content)
- `.chat-interface::after`: `z-index: -1` (border mask)
- `.header .logo::before`: `z-index: -1` (rotating border)
- `.btn-icon`, `.btn-send`: `z-index: 1` (buttons)
- `.btn-icon > *`, `.btn-send > *`: `z-index: 2` (button content)
- `.btn-icon::before`, `.btn-send::before`: `z-index: 1` (hover overlay)
- `.btn-send::after`: `z-index: -1` (blurred glow)

---

## JavaScript Integration & Dynamic UI Behavior

### JavaScript File Structure
The UI is controlled by `public/js/app.js` (ES6 module). The file handles:
- Dynamic class manipulation
- Message creation and rendering
- Button state management
- Status updates
- Attachment handling

### Core JavaScript Functions

#### `setStatus(text, className = '')`
Updates the status indicator in the header.

**Parameters:**
- `text` (string): Status text to display
- `className` (string): Additional CSS class(es) to apply

**Usage Examples:**
```javascript
setStatus('Ready');                           // Default state
setStatus('Listening…', 'listening');        // Red glow, pulsing
setStatus('Speaking…', 'speaking');          // Gold glow, pulsing
setStatus('Error', 'error');                 // Red error state
setStatus('Try again — speak a bit longer', 'status-misfire'); // Misfire state
```

**Status Classes Applied:**
- `.status` (base class, always present)
- `.status.listening` - Red glow, pulsing animation
- `.status.speaking` - Gold glow, pulsing animation
- `.status.error` - Red error styling
- `.status.status-misfire` - Dimmed gold for VAD misfire

#### `syncMicButton(recording = false, disabled = false)`
Synchronizes microphone button state with STT (Speech-to-Text) state.

**Parameters:**
- `recording` (boolean): Whether microphone is actively recording
- `disabled` (boolean): Whether button should be disabled

**Behavior:**
- When `recording = true`:
  - Adds classes: `.active`, `.recording`
  - Sets `aria-pressed="true"`
  - Updates `aria-label` to "Microphone on — click to stop"
- When `recording = false`:
  - Removes classes: `.active`, `.recording`
  - Sets `aria-pressed="false"`
  - Updates `aria-label` to "Microphone — click to talk"
- When `disabled = true`:
  - Sets `btnMic.disabled = true`

**CSS Classes Applied:**
- `.btn-icon.active` - Enhanced glow effect
- `.btn-icon.active.recording` - Red gradient background, pulsing animation

#### `appendMessage(role, content, attachments = [])`
Creates and appends a message to the chat container.

**Parameters:**
- `role` (string): Either `'user'` or `'assistant'`
- `content` (string): Message text content (HTML escaped)
- `attachments` (array): Array of File objects or attachment objects

**HTML Structure Created:**
```html
<div class="message {role}">
  <div class="label">{label}</div>
  <div class="content">{content}</div>
  <!-- If attachments exist: -->
  <div class="attachments">
    <!-- Image attachments: -->
    <img src="..." alt="Attachment" />
    <!-- Audio attachments: -->
    <div class="attachment-audio">
      <span class="file-name">{name}</span>
      <button type="button" class="btn-attachment">Download</button>
    </div>
    <!-- Other file attachments: -->
    <span class="file-name">{name}</span>
  </div>
</div>
```

**Label Text:**
- `role === 'user'` → Label: "You"
- `role === 'assistant'` → Label: "JARVIS"

**Attachment Handling:**
- **Images**: Creates `<img>` element with `max-width: 120px`, `max-height: 120px`
- **Audio**: Creates download button with `.btn-attachment` class
- **Other files**: Displays file name in `.file-name` span

**Auto-scroll:** After appending, automatically scrolls to bottom: `chatContainer.scrollTop = chatContainer.scrollHeight`

### Event Handlers & UI Interactions

#### Send Button (`btnSend`)
- **Click Handler**: Sends text message, clears input, appends user message
- **Keyboard**: Enter key (without Shift) triggers send
- **Disabled State**: Applied when no text or during processing

#### Microphone Button (`btnMic`)
- **Click Handler**: Toggles STT (Speech-to-Text) on/off
- **State Management**: Uses `syncMicButton()` to update UI
- **ARIA**: `aria-pressed` toggles between `"true"` and `"false"`
- **Error Handling**: Shows error status if mic unavailable or API key missing

#### Paperclip Button (`btnPaperclip`)
- **Click Handler**: Triggers hidden file input (`fileInput.click()`)
- **File Selection**: Updates `pendingAttachments` array
- **Placeholder Update**: Changes textarea placeholder to show file count

#### Export PDF Button (`btnExportPdf`)
- **Click Handler**: Extracts all messages, creates PDF, triggers download
- **Message Extraction**: Reads `.label` and `.content` from all `.message` elements

### Dynamic Class Application Flow

#### Status Indicator States
```
Default → setStatus('Ready')
  ↓
Listening → setStatus('Listening…', 'listening')
  ↓ (on speech detected)
Processing → setStatus('Processing…', 'listening')
  ↓ (on TTS start)
Speaking → setStatus('Speaking…', 'speaking')
  ↓ (on TTS end)
Ready → setStatus('Ready')
```

#### Microphone Button States
```
Idle → syncMicButton(false, false)
  ↓ (click, connecting)
Disabled → syncMicButton(false, true)
  ↓ (STT started)
Recording → syncMicButton(true, false) [adds .active .recording]
  ↓ (STT stopped)
Idle → syncMicButton(false, false) [removes .active .recording]
```

### Message Creation Flow

#### User Message (Text Input)
1. User types and clicks send
2. `appendMessage('user', text, attachments)` called
3. Creates `<div class="message user">`
4. Sets status to "Processing…"
5. Sends to n8n webhook
6. On response, creates assistant message
7. If TTS enabled, speaks response
8. Sets status back to "Ready"

#### User Message (Voice Input)
1. User speaks, STT detects speech
2. `onTranscript` callback fires with final text
3. `appendMessage('user', text)` called
4. Sets status to "Processing…"
5. Sends to n8n webhook
6. On response, creates assistant message
7. TTS speaks response
8. STT automatically restarts
9. Sets status to "Listening…"

### Attachment Rendering

#### Image Attachments
```javascript
const img = document.createElement('img');
img.src = a.url || URL.createObjectURL(a);
img.alt = 'Attachment';
// Styled with: max-width: 120px, max-height: 120px, border-radius: 12px
```

#### Audio Attachments
```javascript
const block = document.createElement('div');
block.className = 'attachment-audio';
block.innerHTML = `<span class="file-name">${name}</span>`;
const downloadBtn = document.createElement('button');
downloadBtn.className = 'btn-attachment';
downloadBtn.textContent = 'Download';
// Click handler triggers downloadBlob()
```

#### File Attachments
```javascript
const span = document.createElement('span');
span.className = 'file-name';
span.textContent = name;
```

### Configuration & Initialization

#### Window Configuration Object
```javascript
window.JARVIS_CONFIG = {
  apiKey: 'sk_car_...',      // Cartesia API key
  voiceId: '...',            // Optional voice ID
  n8nWebhookUrl: '...'       // n8n webhook URL
};
```

#### Debug Mode
- **URL Parameter**: `?debug=1` or `?debug=true`
- **Window Variable**: `window.JARVIS_DEBUG = true`
- **Debug Functions**: Exposes `JARVIS_DEBUG_SEND_TEST()` and `JARVIS_DEBUG_CHECK_CONFIG()` in console

### Required DOM Elements

The JavaScript expects these elements to exist (throws error if missing):
- `chatContainer` (id: `chatContainer`)
- `statusEl` (id: `status`)
- `btnSend` (id: `btnSend`)
- `btnMic` (id: `btnMic`)
- `btnPaperclip` (id: `btnPaperclip`)
- `textInput` (id: `textInput`)
- `fileInput` (id: `fileInput`)
- `btnExportPdf` (id: `btnExportPdf`)

### CSS Classes Applied by JavaScript

#### Status Classes
- `.status` (base, always present)
- `.status.listening` - Applied via `setStatus(text, 'listening')`
- `.status.speaking` - Applied via `setStatus(text, 'speaking')`
- `.status.error` - Applied via `setStatus(text, 'error')`
- `.status.status-misfire` - Applied via `setStatus(text, 'status-misfire')`

#### Button Classes
- `.btn-icon.active` - Applied via `btnMic.classList.add('active')`
- `.btn-icon.active.recording` - Applied via `btnMic.classList.add('active', 'recording')`
- Both removed via `btnMic.classList.remove('active', 'recording')`

#### Message Classes
- `.message.user` - Applied via `wrap.className = 'message ' + role` when `role === 'user'`
- `.message.assistant` - Applied via `wrap.className = 'message ' + role` when `role === 'assistant'`

#### Attachment Classes (Created Dynamically)
- `.attachments` - Container div for all attachments
- `.attachment-audio` - Wrapper for audio file attachments
- `.btn-attachment` - Download button for audio files
- `.file-name` - File name display span

### JavaScript Dependencies

The UI JavaScript (`app.js`) imports:
- `CartesiaAudioBridge` from `./cartesia-audio-bridge.js`
- `buildN8nPayload`, `extractReplyFromJson`, `extractFilesFromJson`, `getNaturalFallback` from `./n8n-payload.js`
- `addOcrToAttachments` from `./ocr-tool.js`
- `createPdfBlob`, `createImageBlobFromBase64`, `createTextBlob`, `downloadBlob`, `isAudioFile`, `safeFilename` from `./file-creator.js`
- `DEBUG` from `./debug.js`

---

## Complete Copy-Paste Ready Code

### Full HTML with Inline CSS
The complete HTML file with all styles inline is available in `public/index.html`. Copy the entire `<style>` block and HTML structure from that file.

### Key JavaScript Classes Used
- `.status.listening` - Applied when listening
- `.status.speaking` - Applied when speaking
- `.status.error` - Applied on errors
- `.status.status-misfire` - Applied on VAD misfire
- `.btn-icon.active.recording` - Applied when microphone is recording
- `.message.user` - User message styling
- `.message.assistant` - Assistant message styling

---

## CSS Formatting Notes

### Exact CSS Formatting
The CSS in `public/index.html` uses:
- 2-space indentation (not tabs)
- No trailing semicolons on closing braces
- Comments use `/* */` format
- Media queries use `@media (prefers-reduced-motion: no-preference)`

### Special CSS Details

#### Input Wrap Before Pseudo-element
The `.input-wrap::before` rule has specific indentation (note the extra spaces before `background`):
```css
.input-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius);
  padding: 1px;
      background: linear-gradient(135deg, rgba(196, 30, 58, 0.3), rgba(255, 184, 0, 0.3));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  ...
}
```
This extra indentation is preserved from the original source file.

#### Border Image Syntax
The header uses `border-image` with a gradient:
```css
border-image: linear-gradient(90deg, transparent, var(--iron-red), var(--gold), var(--iron-red-bright), var(--gold), var(--iron-red), transparent) 1;
```
The `1` at the end sets the border-image-slice to 1.

#### Mask Composite
The `.chat-interface::after` and `.input-wrap::before` use mask-composite:
```css
-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
-webkit-mask-composite: xor;
mask-composite: exclude;
```
This creates a border effect using CSS masks.

---

## Verification Checklist

### HTML Elements
- [x] DOCTYPE declaration
- [x] HTML lang attribute
- [x] Meta charset and viewport
- [x] Title tag
- [x] Favicon (SVG data URI)
- [x] Font preconnect links
- [x] Google Fonts link
- [x] Style tag with all CSS
- [x] Script tag for configuration
- [x] Script tag for app.js module
- [x] Chat interface container
- [x] Header with logo, title, status, actions
- [x] Chat container with initial message
- [x] Input row with all buttons and textarea
- [x] Hidden file input
- [x] All required IDs
- [x] All ARIA attributes

### CSS Variables
- [x] All background colors
- [x] All gold color variants
- [x] All red/iron-red color variants
- [x] Text colors
- [x] Border radius values
- [x] Easing functions

### CSS Rules
- [x] Universal selector (*)
- [x] Body and pseudo-elements
- [x] Chat interface and pseudo-elements
- [x] Header and all sub-elements
- [x] Logo and animations
- [x] Status indicator and all states
- [x] Chat container and scrollbar
- [x] Messages (user and assistant)
- [x] Message labels and content
- [x] Attachments styling
- [x] Input row and wrapper
- [x] Textarea styling
- [x] All button styles (icon, send)
- [x] All button states (hover, active, disabled, focus)
- [x] All animations and keyframes
- [x] Media queries
- [x] File input hiding

### JavaScript Integration
- [x] setStatus function documentation
- [x] syncMicButton function documentation
- [x] appendMessage function documentation
- [x] Event handlers documentation
- [x] Dynamic class application flow
- [x] Message creation flow
- [x] Attachment rendering
- [x] Configuration object
- [x] Debug mode
- [x] Required DOM elements

### SVG Icons
- [x] Paperclip icon (full SVG)
- [x] Send icon (full SVG)
- [x] Microphone icon (full SVG)
- [x] Export PDF icon (full SVG)
- [x] Icon styling and transforms

### Documentation
- [x] Color palette with hex codes
- [x] Typography specifications
- [x] Component dimensions
- [x] Spacing and padding values
- [x] Animation details
- [x] Layout specifications
- [x] Accessibility features
- [x] Browser compatibility notes
- [x] Performance considerations

---

## Complete File Reference

### Source Files
- **HTML**: `public/index.html` - Complete HTML with inline CSS
- **JavaScript**: `public/js/app.js` - UI control and interaction logic
- **Audio Bridge**: `public/js/cartesia-audio-bridge.js` - STT/TTS integration
- **N8N Payload**: `public/js/n8n-payload.js` - Webhook payload building
- **File Creator**: `public/js/file-creator.js` - File download utilities
- **OCR Tool**: `public/js/ocr-tool.js` - Image OCR processing
- **Debug**: `public/js/debug.js` - Debug logging utilities

### Asset Files
- **STT Processor**: `public/audio/stt-capture-processor.js` - AudioWorklet for STT
- **TTS Processor**: `public/audio/tts-playback-processor.js` - AudioWorklet for TTS

### Configuration
- **Environment Variables**: `.env` file (not in repo, use `VITE_` prefix)
- **Window Config**: `window.JARVIS_CONFIG` object in HTML script tag

---

**End of UI Specifications**

This document contains every single detail about the JARVIS UI codebase, including:
- All CSS rules and properties
- All HTML structure and attributes
- All JavaScript class manipulations
- All SVG icon specifications
- All color values and gradients
- All animations and keyframes
- All component dimensions and spacing
- All accessibility features
- All dynamic behaviors

The code can be copied directly from this document and will produce an identical UI.
