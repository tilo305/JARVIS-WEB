/**
 * Centralized security configuration for JARVIS-WEB.
 * Based on OWASP Developer Guide and Building Secure and Reliable Systems.
 *
 * All security-related env vars and defaults in one place.
 */

/**
 * Load security configuration from environment.
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {SecurityConfig}
 */
export function loadSecurityConfig(env = process.env) {
  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedN8nWebhooks = (env.ALLOWED_N8N_WEBHOOKS || env.N8N_WEBHOOK_URL || env.VITE_N8N_WEBHOOK_URL || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  return {
    // CORS
    allowedOrigins,

    // WebSocket auth (optional): if set, require token in ?token= query param
    wsAuthToken: env.WS_AUTH_TOKEN || '',

    // Rate limiting
    rateLimit: {
      windowMs: Number(env.RATE_LIMIT_WINDOW_MS) || 60_000,
      maxRequests: Number(env.RATE_LIMIT_MAX) || 100,
      maxApiRequests: Number(env.RATE_LIMIT_API_MAX) || 60,
    },

    // Security logging
    securityLog: {
      enabled: env.SECURITY_LOG_ENABLED === '1' || env.SECURITY_LOG_ENABLED === 'true',
      level: env.SECURITY_LOG_LEVEL || 'warn',
    },

    // n8n proxy (optional): enable POST /api/n8n-proxy to avoid CORS
    n8nProxy: {
      enabled: env.N8N_PROXY_ENABLED === '1' || env.N8N_PROXY_ENABLED === 'true',
      allowedUrls: allowedN8nWebhooks,
      timeoutMs: Number(env.N8N_PROXY_TIMEOUT_MS) || 30_000,
    },

    // MCP (existing)
    mcp: {
      enabled: env.ENABLE_MCP === '1' || env.ENABLE_MCP === 'true',
      apiSecret: env.MCP_API_SECRET || '',
    },

    isProduction: env.NODE_ENV === 'production',
  };
}
