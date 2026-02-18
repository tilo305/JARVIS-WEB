/**
 * Integration tests for JARVIS-WEB.
 * @see jEsT dOcS.md — Project Test Structure, Integration Tests
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

describe('Integration', () => {
  describe('WebSocket server', () => {
    let server;
    let wsServer;
    let port;

    beforeEach(async () => {
      server = createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
      });
      wsServer = new WebSocketServer({ server });

      await new Promise((resolve) => {
        server.listen(0, () => {
          port = server.address().port;
          resolve();
        });
      });
    });

    afterEach(async () => {
      if (wsServer) wsServer.close();
      if (server) {
        await new Promise((resolve) => server.close(() => resolve()));
      }
    });

    it('should start HTTP server and respond', async () => {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      expect(res.ok).toBe(true);
      const text = await res.text();
      expect(text).toBe('ok');
    });

    it('should accept WebSocket connections', async () => {
      const WebSocket = (await import('ws')).default;
      const client = new WebSocket(`ws://127.0.0.1:${port}/`);

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          client.close();
          reject(new Error('WebSocket timeout'));
        }, 2000);
        client.on('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        client.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      expect(client.readyState).toBe(WebSocket.OPEN);
      client.close();
    });
  });
});
