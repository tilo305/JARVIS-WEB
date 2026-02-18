#!/usr/bin/env node
/** Quick CSP + nonce verification for server.js */
import http from 'node:http';

const url = 'http://localhost:3000/';
http.get(url, (res) => {
  const csp = res.headers['content-security-policy'];
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    const hasNonce = csp && csp.includes('nonce-');
    const bodyNonceMatch = body.match(/nonce="([^"]+)"/);
    const bodyPlaceholder = body.includes('{{CSP_NONCE}}');
    const headerNonceMatch = csp && csp.match(/nonce-([^'\s]+)/);
    const headerNonce = headerNonceMatch?.[1];
    const bodyNonce = bodyNonceMatch?.[1];
    const match = bodyNonce && headerNonce && bodyNonce === headerNonce;

    console.log('Status:', res.statusCode);
    console.log('CSP has nonce:', !!hasNonce);
    console.log('Body nonce injected (no placeholder):', !!bodyNonce && !bodyPlaceholder);
    console.log('Header nonce matches body:', match);

    if (res.statusCode !== 200) {
      console.error('FAIL: status not 200');
      process.exit(1);
    }
    if (!hasNonce) {
      console.error('FAIL: CSP missing nonce');
      process.exit(1);
    }
    if (bodyPlaceholder) {
      console.error('FAIL: placeholder {{CSP_NONCE}} still in body');
      process.exit(1);
    }
    if (!match) {
      console.error('FAIL: nonce mismatch');
      process.exit(1);
    }
    console.log('OK: CSP + nonce working');
    process.exit(0);
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
