/**
 * JARVIS Animated Favicon - Holographic Iron Man Helmet
 * Modern holographic design with animated glow and scan effects
 */
/* global module */
/* eslint-disable no-console */

class HolographicFavicon {
  constructor() {
    console.log('🎨 HolographicFavicon: Constructor called');
    this.canvas = document.createElement('canvas');
    this.canvas.width = 64;
    this.canvas.height = 64;
    this.ctx = this.canvas.getContext('2d');
    this.frame = 0;
    this.scanLinePosition = 0;
    this.glowPhase = 0;
    this.state = 'idle'; // idle, listening, speaking, error
    this.speed = 0.05;
    
    // Create or get favicon link element
    this.link = document.querySelector("link[rel*='icon']") || this.createLink();
    console.log('🎨 HolographicFavicon: Link element:', this.link);
    console.log('🎨 HolographicFavicon: Canvas context:', this.ctx ? 'OK' : 'FAILED');
  }

  createLink() {
    console.log('🔗 Creating new favicon link element');
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);
    console.log('🔗 Link element created and added to head');
    return link;
  }

  /**
   * Draw holographic Iron Man helmet
   */
  drawIronManHelmet(glowIntensity, hue) {
    const ctx = this.ctx;
    const w = 64;
    const h = 64;
    const cx = w / 2;
    const cy = h / 2;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Dark background with slight gradient
    const bgGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
    bgGradient.addColorStop(0, '#0f1419');
    bgGradient.addColorStop(1, '#050810');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    // Holographic glow aura
    const auraGradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 35);
    auraGradient.addColorStop(0, `hsla(${hue}, 100%, 60%, ${glowIntensity * 0.3})`);
    auraGradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${glowIntensity * 0.15})`);
    auraGradient.addColorStop(1, 'rgba(0, 217, 255, 0)');
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.fill();

    // Save context for transformations
    ctx.save();
    ctx.translate(cx, cy);

    // Draw Iron Man helmet outline
    this.drawHelmetOutline(ctx, glowIntensity, hue);

    // Draw eye slits (glowing)
    this.drawEyeSlits(ctx, glowIntensity, hue);

    // Draw faceplate details
    this.drawFaceplateDetails(ctx, glowIntensity, hue);

    ctx.restore();

    // Holographic scan line effect
    this.drawScanLines(ctx, glowIntensity);

    // Edge glow enhancement
    this.drawEdgeGlow(ctx, glowIntensity, hue);
  }

  /**
   * Draw helmet outline with holographic glow
   */
  drawHelmetOutline(ctx, glowIntensity, hue) {
    const glow = glowIntensity * 0.8 + 0.2;
    
    // Outer helmet shape (simplified geometric Iron Man helmet)
    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${glow})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Helmet top and sides
    ctx.beginPath();
    // Top arc
    ctx.moveTo(-12, -20);
    ctx.quadraticCurveTo(0, -24, 12, -20);
    // Right side
    ctx.lineTo(16, -10);
    ctx.lineTo(18, 0);
    ctx.lineTo(16, 10);
    ctx.quadraticCurveTo(14, 18, 8, 22);
    // Chin
    ctx.lineTo(0, 24);
    ctx.lineTo(-8, 22);
    // Left side
    ctx.quadraticCurveTo(-14, 18, -16, 10);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-16, -10);
    ctx.lineTo(-12, -20);
    ctx.stroke();

    // Inner glow for outline
    ctx.shadowBlur = 8;
    ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${glow})`;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /**
   * Draw glowing eye slits
   */
  drawEyeSlits(ctx, glowIntensity, hue) {
    const glow = glowIntensity * 0.9 + 0.1;
    
    // Left eye
    ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${glow})`;
    ctx.shadowBlur = 12;
    ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${glow})`;
    
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.lineTo(-6, -8);
    ctx.lineTo(-4, -5);
    ctx.lineTo(-6, -2);
    ctx.closePath();
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.moveTo(12, -5);
    ctx.lineTo(6, -8);
    ctx.lineTo(4, -5);
    ctx.lineTo(6, -2);
    ctx.closePath();
    ctx.fill();

    // Bright eye cores
    ctx.fillStyle = `hsla(${hue + 20}, 100%, 90%, ${glow})`;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(-8, -5, 2, 0, Math.PI * 2);
    ctx.arc(8, -5, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }

  /**
   * Draw faceplate geometric details
   */
  drawFaceplateDetails(ctx, glowIntensity, hue) {
    const glow = glowIntensity * 0.6 + 0.2;
    
    ctx.strokeStyle = `hsla(${hue}, 100%, 55%, ${glow * 0.6})`;
    ctx.lineWidth = 1;

    // Center vertical line
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 22);
    ctx.stroke();

    // Horizontal sections
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.lineTo(10, 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-8, 10);
    ctx.lineTo(8, 10);
    ctx.stroke();

    // Cheek plates
    ctx.strokeStyle = `hsla(${hue}, 100%, 55%, ${glow * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(-14, 5);
    ctx.lineTo(-10, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(14, 5);
    ctx.lineTo(10, 8);
    ctx.stroke();
  }

  /**
   * Draw holographic scan lines
   */
  drawScanLines(ctx, glowIntensity) {
    ctx.strokeStyle = `rgba(0, 217, 255, ${glowIntensity * 0.3})`;
    ctx.lineWidth = 1;

    // Multiple scan lines moving down
    for (let i = 0; i < 3; i++) {
      const y = (this.scanLinePosition + i * 20) % 70;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(64, y);
      ctx.stroke();
    }
  }

  /**
   * Draw edge glow effect
   */
  drawEdgeGlow(ctx, glowIntensity, hue) {
    // Subtle edge lighting
    ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${glowIntensity * 0.2})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${glowIntensity * 0.3})`;
    ctx.strokeRect(2, 2, 60, 60);
    ctx.shadowBlur = 0;
  }

  /**
   * Animation loop
   */
  animate() {
    this.frame++;
    
    // Log first frame
    if (this.frame === 1) {
      console.log('🎬 HolographicFavicon: Animation started!');
      console.log('   - State:', this.state);
      console.log('   - Link element:', this.link);
    }
    
    // Calculate glow intensity (pulsing effect)
    const baseIntensity = 0.5 + (Math.sin(this.frame * this.speed) + 1) * 0.25;
    
    // State-based modifications
    let glowIntensity = baseIntensity;
    let hue = 190; // Cyan base
    
    switch (this.state) {
      case 'listening':
        glowIntensity = 0.7 + (Math.sin(this.frame * 0.15) + 1) * 0.15;
        hue = 200; // Brighter cyan
        break;
      case 'speaking':
        glowIntensity = 0.8 + (Math.sin(this.frame * 0.2) + 1) * 0.1;
        hue = 180 + Math.sin(this.frame * 0.1) * 20; // Color shift cyan-blue
        break;
      case 'error':
        glowIntensity = 0.6 + (Math.sin(this.frame * 0.3) + 1) * 0.2;
        hue = 0; // Red
        break;
      case 'idle':
      default:
        glowIntensity = baseIntensity;
        hue = 190; // Cyan
        break;
    }

    // Update scan line position
    this.scanLinePosition = (this.scanLinePosition + 0.5) % 70;

    // Draw the helmet
    this.drawIronManHelmet(glowIntensity, hue);

    // Update favicon
    this.link.href = this.canvas.toDataURL('image/png');
    
    // Log every 60 frames (once per second at 60fps)
    if (this.frame % 60 === 0) {
      console.log(`🎨 Favicon animating: frame ${this.frame}, state: ${this.state}`);
    }

    // Continue animation
    requestAnimationFrame(() => this.animate());
  }

  /**
   * Set favicon state (changes animation behavior)
   * @param {string} state - 'idle', 'listening', 'speaking', 'error'
   */
  setState(state) {
    this.state = state;
    
    switch (state) {
      case 'listening':
        this.speed = 0.15; // Medium pulse
        break;
      case 'speaking':
        this.speed = 0.2; // Fast pulse
        break;
      case 'error':
        this.speed = 0.3; // Very fast pulse
        break;
      case 'idle':
      default:
        this.speed = 0.05; // Slow, gentle pulse
        break;
    }
  }

  /**
   * Start the animation
   */
  start() {
    this.animate();
  }

  /**
   * Stop the animation
   */
  stop() {
    // Animation will stop after current frame
    this.isRunning = false;
  }
}

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HolographicFavicon;
}

// Auto-start if loaded directly in browser
if (typeof window !== 'undefined') {
  window.HolographicFavicon = HolographicFavicon;
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window._holographicFaviconInstance) {
        console.log('✨ Auto-initializing holographic favicon...');
        window._holographicFaviconInstance = new HolographicFavicon();
        window._holographicFaviconInstance.start();
        console.log('✅ Holographic favicon started!');
      }
    });
  } else {
    // DOM already loaded
    if (!window._holographicFaviconInstance) {
      console.log('✨ Auto-initializing holographic favicon (immediate)...');
      window._holographicFaviconInstance = new HolographicFavicon();
      window._holographicFaviconInstance.start();
      console.log('✅ Holographic favicon started!');
    }
  }
}

