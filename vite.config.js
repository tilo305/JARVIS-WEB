import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    root: 'public',
    publicDir: false,
    plugins: [
      viteStaticCopy({
        targets: [
          { src: 'audio/*', dest: 'audio' },
        ],
      }),
    ],
    build: {
      outDir: 'dist-public', // relative to config file (project root), not to root: 'public'
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      open: true,
    },
    define: {
      'import.meta.env.VITE_CARTESIA_API_KEY': JSON.stringify(env.CARTESIA_API_KEY || ''),
      'import.meta.env.VITE_CARTESIA_VOICE_ID': JSON.stringify(env.CARTESIA_VOICE_ID || ''),
      'import.meta.env.VITE_N8N_WEBHOOK_URL': JSON.stringify(
        env.VITE_N8N_WEBHOOK_URL || 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4'
      ),
    },
  };
});
