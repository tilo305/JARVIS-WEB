#!/usr/bin/env node
/**
 * Validate security modules: scripts/security-config, security-logger, rate-limiter.
 * Runs unit-style assertions via Node (ESM). Per zEn DeBuGgEr.md.
 */
import { loadSecurityConfig } from '../../scripts/security-config.mjs';
import { createSecurityLogger } from '../../scripts/security-logger.mjs';
import { createRateLimiter } from '../../scripts/rate-limiter.mjs';

const errors = [];

function assert(cond, msg) {
  if (!cond) errors.push(msg);
}

// security-config
const cfgEmpty = loadSecurityConfig({});
assert(Array.isArray(cfgEmpty.allowedOrigins) && cfgEmpty.allowedOrigins.length === 0, 'config: allowedOrigins default');
assert(cfgEmpty.wsAuthToken === '', 'config: wsAuthToken default');
assert(cfgEmpty.rateLimit.windowMs === 60_000, 'config: rateLimit.windowMs default');
assert(cfgEmpty.rateLimit.maxRequests === 100, 'config: rateLimit.maxRequests default');
assert(cfgEmpty.n8nProxy.enabled === false, 'config: n8nProxy.enabled default');

const cfgOrigins = loadSecurityConfig({ ALLOWED_ORIGINS: 'http://a.com, https://b.com' });
assert(
  cfgOrigins.allowedOrigins.length === 2 && cfgOrigins.allowedOrigins.includes('http://a.com'),
  'config: parse ALLOWED_ORIGINS'
);

const cfgWs = loadSecurityConfig({ WS_AUTH_TOKEN: 'secret123' });
assert(cfgWs.wsAuthToken === 'secret123', 'config: WS_AUTH_TOKEN');

const cfgProxy = loadSecurityConfig({ N8N_PROXY_ENABLED: '1' });
assert(cfgProxy.n8nProxy.enabled === true, 'config: N8N_PROXY_ENABLED');

// security-logger
const log = createSecurityLogger({ enabled: false });
assert(typeof log.authFailure === 'function', 'logger: authFailure');
assert(typeof log.rateLimit === 'function', 'logger: rateLimit');
assert(typeof log.wsAuthReject === 'function', 'logger: wsAuthReject');
assert(typeof log.proxyReject === 'function', 'logger: proxyReject');
try {
  log.authFailure('test');
  log.rateLimit('key', {});
  log.wsAuthReject('reason');
  log.proxyReject('reason');
  log.error('msg');
  log.info('msg');
} catch (e) {
  errors.push(`logger: threw ${e.message}`);
}

// rate-limiter
const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });
const r1 = limiter.check('k1');
const r2 = limiter.check('k1');
const r3 = limiter.check('k1');
assert(r1.allowed && r2.allowed && r3.allowed, 'rate-limiter: allow under limit');
assert(r3.remaining === 0, 'rate-limiter: remaining');

const lim2 = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
lim2.check('k2');
lim2.check('k2');
const rOver = lim2.check('k2');
assert(!rOver.allowed, 'rate-limiter: reject over limit');

const lim3 = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
assert(lim3.check('a').allowed && lim3.check('b').allowed, 'rate-limiter: keys separate');
assert(!lim3.check('a').allowed, 'rate-limiter: key a over limit');

if (errors.length > 0) {
  console.error('Security modules validation FAILED:\n');
  errors.forEach((e) => console.error('  ❌', e));
  process.exit(1);
}

console.log('✓ Security modules valid (security-config, security-logger, rate-limiter)');
process.exit(0);
