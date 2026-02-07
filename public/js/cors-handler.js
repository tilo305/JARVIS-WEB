/**
 * CORS Handler and Diagnostics
 * 
 * Based on MDN CORS documentation: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
 * 
 * This module provides:
 * - CORS preflight testing (OPTIONS request)
 * - CORS error detection and diagnostics
 * - Comprehensive error reporting
 * 
 * @module cors-handler
 */

'use strict';

/**
 * Test CORS preflight (OPTIONS request) for a given URL.
 * According to MDN, POST requests with application/json trigger preflight.
 * 
 * @param {string} url - The URL to test
 * @param {string} origin - The origin making the request (defaults to window.location.origin)
 * @returns {Promise<{success: boolean, headers: Object, error?: string}>>}
 */
export async function testCORSPreflight(url, origin = window.location.origin) {
  try {
    /* eslint-disable-next-line no-console -- intentional: diagnostic tool */
    console.log('[JARVIS] CORS: Testing preflight (OPTIONS) request', { url, origin });
    
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
      mode: 'cors',
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      'Access-Control-Max-Age': response.headers.get('Access-Control-Max-Age'),
    };
    
    const success = response.ok && corsHeaders['Access-Control-Allow-Origin'] !== null;
    
    /* eslint-disable-next-line no-console -- intentional: diagnostic tool */
    console.log('[JARVIS] CORS: Preflight test result', {
      success,
      status: response.status,
      statusText: response.statusText,
      corsHeaders,
      url,
      origin
    });
    
    return {
      success,
      status: response.status,
      statusText: response.statusText,
      headers: corsHeaders,
      allHeaders: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    /* eslint-disable-next-line no-console -- intentional: diagnostic tool */
    console.error('[JARVIS] CORS: Preflight test failed', {
      error: error.message,
      errorName: error.name,
      url,
      origin
    });
    
    return {
      success: false,
      error: error.message,
      errorName: error.name,
      headers: {},
    };
  }
}

/**
 * Comprehensive CORS diagnostics for a given URL.
 * Tests both preflight and actual request capabilities.
 * 
 * @param {string} url - The URL to diagnose
 * @param {Object} [options] - Options
 * @param {string} [options.origin] - Origin to test from (defaults to window.location.origin)
 * @param {Object} [options.testPayload] - Test payload for POST request
 * @returns {Promise<Object>} Diagnostic results
 */
export async function diagnoseCORS(url, options = {}) {
  const origin = options.origin || window.location.origin;
  const testPayload = options.testPayload || { message: 'CORS test', source: 'diagnostic' };
  
  const diagnostics = {
    url,
    origin,
    protocol: window.location.protocol,
    isHttps: window.location.protocol === 'https:',
    isLocalhost: origin.includes('localhost') || origin.includes('127.0.0.1'),
    webhookIsHttps: url.startsWith('https://'),
    mixedContent: window.location.protocol === 'http:' && url.startsWith('https://'),
    timestamp: new Date().toISOString(),
    preflight: null,
    actualRequest: null,
    recommendations: [],
  };
  
  /* eslint-disable-next-line no-console -- intentional: diagnostic tool */
  console.log('[JARVIS] CORS: Starting comprehensive diagnostics', diagnostics);
  
  // Test 1: Preflight (OPTIONS)
  diagnostics.preflight = await testCORSPreflight(url, origin);
  
  // Test 2: Actual POST request
  try {
    /* eslint-disable-next-line no-console -- intentional: diagnostic tool */
    console.log('[JARVIS] CORS: Testing actual POST request', { url, origin });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': origin,
      },
      body: JSON.stringify(testPayload),
      mode: 'cors',
    });
    
    const responseHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
    };
    
    diagnostics.actualRequest = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      corsHeaders: responseHeaders,
      hasCORSHeaders: responseHeaders['Access-Control-Allow-Origin'] !== null,
    };
    
    /* eslint-disable-next-line no-console -- intentional: diagnostic tool */
    console.log('[JARVIS] CORS: Actual request test result', diagnostics.actualRequest);
  } catch (error) {
    diagnostics.actualRequest = {
      success: false,
      error: error.message,
      errorName: error.name,
      isCORS: error.message === 'Failed to fetch' || error.name === 'TypeError',
    };
    
    /* eslint-disable-next-line no-console -- intentional: diagnostic tool */
    console.error('[JARVIS] CORS: Actual request test failed', diagnostics.actualRequest);
  }
  
  // Generate recommendations
  if (!diagnostics.preflight.success) {
    diagnostics.recommendations.push({
      severity: 'error',
      issue: 'Preflight (OPTIONS) request failed',
      solution: 'Configure n8n server to respond to OPTIONS requests with CORS headers',
      details: 'The server must respond to OPTIONS requests with: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers',
    });
  }
  
  if (diagnostics.actualRequest && !diagnostics.actualRequest.success && diagnostics.actualRequest.isCORS) {
    diagnostics.recommendations.push({
      severity: 'error',
      issue: 'CORS error on actual POST request',
      solution: 'Configure n8n server to include Access-Control-Allow-Origin header in POST responses',
      details: 'The server must include Access-Control-Allow-Origin header in the response',
    });
  }
  
  if (diagnostics.mixedContent) {
    diagnostics.recommendations.push({
      severity: 'warning',
      issue: 'Mixed content detected (HTTP page → HTTPS webhook)',
      solution: 'Serve the frontend over HTTPS or use HTTP webhook',
      details: 'Browsers may block mixed content requests',
    });
  }
  
  if (!diagnostics.preflight.success && diagnostics.actualRequest && diagnostics.actualRequest.isCORS) {
    diagnostics.recommendations.push({
      severity: 'info',
      issue: 'CORS configuration needed',
      solution: 'Add CORS headers to n8n webhook responses',
      details: 'See docs/CORS-CONFIGURATION.md for n8n server configuration',
    });
  }
  
  /* eslint-disable-next-line no-console -- intentional: diagnostic tool */
  console.log('[JARVIS] CORS: Diagnostics complete', diagnostics);
  
  return diagnostics;
}

/**
 * Detect if an error is CORS-related.
 * Based on MDN: CORS failures result in errors but specifics are not available to JavaScript.
 * 
 * @param {Error} error - The error to check
 * @param {string} url - The URL that was requested
 * @returns {Object} CORS detection result
 */
export function detectCORSError(error, url) {
  const errorMessage = error?.message || String(error);
  const errorName = error?.name;
  
  // CORS errors typically manifest as "Failed to fetch" TypeError
  // But this is also generic for network errors, so we need additional checks
  const isGenericNetworkError = errorMessage === 'Failed to fetch' && errorName === 'TypeError';
  
  // Check if it's likely CORS (cross-origin request)
  const origin = window.location.origin;
  const urlOrigin = new URL(url).origin;
  const isCrossOrigin = origin !== urlOrigin;
  
  return {
    isLikelyCORS: isGenericNetworkError && isCrossOrigin,
    isNetworkError: isGenericNetworkError,
    isCrossOrigin: isCrossOrigin,
    origin,
    urlOrigin,
    errorMessage,
    errorName,
    recommendation: isGenericNetworkError && isCrossOrigin
      ? 'This is likely a CORS error. The server must include Access-Control-Allow-Origin header.'
      : isGenericNetworkError
        ? 'This is a network error. Check server availability, DNS, and firewall settings.'
        : 'Unknown error type.',
  };
}

/**
 * Get CORS configuration recommendations for n8n server.
 * 
 * @param {string} origin - The origin that needs access
 * @returns {Object} Server configuration recommendations
 */
export function getCORSConfigurationGuide(origin = window.location.origin) {
  return {
    origin,
    requiredHeaders: {
      'Access-Control-Allow-Origin': origin === '*' ? '*' : origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
    n8nConfiguration: {
      description: 'Configure n8n webhook to allow CORS requests',
      steps: [
        'In n8n workflow, add a "Set" node before the webhook response',
        'Set headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers',
        'For OPTIONS requests (preflight), return 200 with CORS headers and empty body',
        'For POST requests, include Access-Control-Allow-Origin in response headers',
      ],
      exampleHeaders: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    },
    documentation: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS',
  };
}
