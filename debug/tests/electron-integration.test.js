/**
 * Electron integration test — structure and wiring.
 * Verifies Electron main, preload, and frontend/bridge wiring for 0 errors.
 * @see zEn DeBuGgEr.md
 */
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '../..');
const ELECTRON_MAIN = join(ROOT, 'electron/main.js');
const ELECTRON_PRELOAD = join(ROOT, 'electron/preload.js');
const BRIDGE_JS = join(ROOT, 'public/js/cartesia-audio-bridge.js');
const APP_JS = join(ROOT, 'public/js/app.js');

describe('Electron integration', () => {
  describe('electron/main.js', () => {
    it('exists', () => {
      expect(existsSync(ELECTRON_MAIN)).toBe(true);
    });

    it('uses preload script', () => {
      const main = readFileSync(ELECTRON_MAIN, 'utf8');
      expect(main).toMatch(/preload/);
      expect(main).toMatch(/PRELOAD_PATH|preload\.js/);
    });

    it('loads Vite dev URL in dev and dist-public in built', () => {
      const main = readFileSync(ELECTRON_MAIN, 'utf8');
      expect(main).toMatch(/localhost|VITE_DEV_PORT/);
      expect(main).toMatch(/dist-public|loadFile/);
    });

    it('has contextIsolation and no nodeIntegration in renderer', () => {
      const main = readFileSync(ELECTRON_MAIN, 'utf8');
      expect(main).toMatch(/contextIsolation:\s*true/);
      expect(main).toMatch(/nodeIntegration:\s*false/);
    });
  });

  describe('electron/preload.js', () => {
    it('exists', () => {
      expect(existsSync(ELECTRON_PRELOAD)).toBe(true);
    });

    it('exposes electronAPI via contextBridge', () => {
      const preload = readFileSync(ELECTRON_PRELOAD, 'utf8');
      expect(preload).toMatch(/contextBridge/);
      expect(preload).toMatch(/exposeInMainWorld\s*\(\s*["']electronAPI["']/);
      expect(preload).toMatch(/isElectron:\s*true/);
      expect(preload).toMatch(/platform:\s*process\.platform/);
      expect(preload).toMatch(/versions/);
    });

    it('exposes setTitle (Pattern 1 one-way) and onMenuAction (Pattern 3 main→renderer)', () => {
      const preload = readFileSync(ELECTRON_PRELOAD, 'utf8');
      expect(preload).toMatch(/setTitle/);
      expect(preload).toMatch(/onMenuAction/);
      expect(preload).toMatch(/menu-action/);
    });
  });

  describe('cartesia-audio-bridge.js (AudioWorklet + file://)', () => {
    it('treats file:// as absolute URL for AudioWorklet', () => {
      const bridge = readFileSync(BRIDGE_JS, 'utf8');
      expect(bridge).toMatch(/file:/);
      expect(bridge).toMatch(/startsWith\s*\(\s*["']file:/);
    });
  });

  describe('app.js (Electron + JARVIS_BRIDGE)', () => {
    it('sets JARVIS_IS_ELECTRON when electronAPI present', () => {
      const app = readFileSync(APP_JS, 'utf8');
      expect(app).toMatch(/electronAPI\?\.isElectron/);
      expect(app).toMatch(/JARVIS_IS_ELECTRON\s*=\s*true/);
    });

    it('exposes JARVIS_BRIDGE for Ready button and UI', () => {
      const app = readFileSync(APP_JS, 'utf8');
      expect(app).toMatch(/window\.JARVIS_BRIDGE\s*=\s*bridge/);
    });

    it('wires onMenuAction for Electron menu IPC (Pattern 3)', () => {
      const app = readFileSync(APP_JS, 'utf8');
      expect(app).toMatch(/electronAPI\?\.onMenuAction/);
      expect(app).toMatch(/showNotification/);
    });
  });
});
