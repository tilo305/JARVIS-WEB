/**
 * Browser-Side Security Utilities
 * Based on OWASP Top 10, Building Secure and Reliable Systems, and security best practices
 * 
 * Provides client-side validation, sanitization, and security checks
 */

/**
 * Allowed file MIME types for uploads
 * Based on OWASP file upload security guidelines
 */
const ALLOWED_MIME_TYPES = {
  // Images
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  
  // Audio
  'audio/mpeg': [0xFF, 0xFB],
  'audio/mp3': [0xFF, 0xFB],
  'audio/wav': [0x52, 0x49, 0x46, 0x46],
  'audio/webm': [0x1A, 0x45, 0xDF, 0xA3],
  'audio/ogg': [0x4F, 0x67, 0x67, 0x53],
  
  // Documents
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'text/plain': null, // No magic bytes for plain text
};

/**
 * Maximum file size limits (in bytes)
 */
const MAX_FILE_SIZES = {
  'image/jpeg': 10 * 1024 * 1024, // 10 MB
  'image/png': 10 * 1024 * 1024,
  'image/gif': 10 * 1024 * 1024,
  'image/webp': 10 * 1024 * 1024,
  'audio/mpeg': 15 * 1024 * 1024, // 15 MB
  'audio/mp3': 15 * 1024 * 1024,
  'audio/wav': 15 * 1024 * 1024,
  'audio/webm': 15 * 1024 * 1024,
  'audio/ogg': 15 * 1024 * 1024,
  'application/pdf': 10 * 1024 * 1024,
  'text/plain': 5 * 1024 * 1024, // 5 MB
  'default': 15 * 1024 * 1024, // 15 MB default
};

/**
 * Dangerous file extensions that should never be allowed
 * Based on OWASP file upload security guidelines
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.sh', '.ps1', '.dll', '.msi', '.app', '.deb', '.rpm', '.dmg',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.cgi',
];

/**
 * Validates file magic bytes against expected MIME type
 * Prevents MIME type spoofing attacks
 */
function validateFileMagicBytes(fileBuffer, expectedMimeType) {
  const magicBytes = ALLOWED_MIME_TYPES[expectedMimeType];
  
  if (!magicBytes) {
    // Plain text doesn't have magic bytes, allow it
    return expectedMimeType === 'text/plain';
  }
  
  const buffer = new Uint8Array(fileBuffer.slice(0, magicBytes.length));
  
  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates file extension against dangerous extensions
 */
function isDangerousExtension(filename) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return DANGEROUS_EXTENSIONS.includes(ext);
}

/**
 * Validates file size against configured limits
 */
function validateFileSize(size, mimeType) {
  const maxSize = MAX_FILE_SIZES[mimeType] || MAX_FILE_SIZES.default;
  return size <= maxSize;
}

/**
 * Validates MIME type is in allowed list
 */
function isValidMimeType(mimeType) {
  return mimeType in ALLOWED_MIME_TYPES;
}

/**
 * Comprehensive file validation
 * Implements defense in depth: extension, MIME type, magic bytes, size
 */
export async function validateFile(file, options = {}) {
  const { checkMagicBytes = true, strictMimeType = true } = options;
  
  // Check dangerous extensions
  if (isDangerousExtension(file.name)) {
    return {
      valid: false,
      error: `Dangerous file extension not allowed: ${file.name.substring(file.name.lastIndexOf('.'))}`,
    };
  }
  
  // Check MIME type
  if (strictMimeType && !isValidMimeType(file.type)) {
    return {
      valid: false,
      error: `Invalid MIME type: ${file.type}`,
    };
  }
  
  // Check file size
  if (!validateFileSize(file.size, file.type)) {
    const maxSize = MAX_FILE_SIZES[file.type] || MAX_FILE_SIZES.default;
    return {
      valid: false,
      error: `File size ${file.size} exceeds maximum ${maxSize} bytes`,
    };
  }
  
  // Check magic bytes if requested
  if (checkMagicBytes) {
    try {
      const arrayBuffer = await file.slice(0, 16).arrayBuffer();
      if (!validateFileMagicBytes(arrayBuffer, file.type)) {
        return {
          valid: false,
          error: `File magic bytes do not match declared MIME type: ${file.type}`,
        };
      }
    } catch (err) {
      return {
        valid: false,
        error: `Failed to validate file magic bytes: ${err.message || 'Unknown error'}`,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Sanitizes filename to prevent path traversal and injection attacks
 */
export function sanitizeFilename(filename) {
  // Remove path components
  let sanitized = filename.replace(/[/\\]/g, '_');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters (eslint-disable for necessary control character check)
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes user input to prevent XSS
 * Based on OWASP XSS Prevention Cheat Sheet
 */
export function sanitizeHtml(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Validates URL to prevent SSRF and open redirect attacks
 */
export function isValidUrl(url, allowedDomains = []) {
  try {
    const urlObj = new URL(url);
    
    // Block dangerous protocols
    if (!['http:', 'https:', 'wss:', 'ws:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // If allowed domains specified, check against them
    if (allowedDomains && allowedDomains.length > 0) {
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    }
  
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates webhook response to prevent XSS and injection attacks
 */
export function sanitizeWebhookResponse(response) {
  if (typeof response === 'string') {
    return sanitizeHtml(response);
  }
  
  if (Array.isArray(response)) {
    return response.map(item => sanitizeWebhookResponse(item));
  }
  
  if (response && typeof response === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(response)) {
      // Sanitize keys
      const sanitizedKey = sanitizeHtml(key);
      sanitized[sanitizedKey] = sanitizeWebhookResponse(value);
    }
    return sanitized;
  }
  
  return response;
}

/**
 * Rate limiting implementation (client-side, basic)
 * Note: Real rate limiting should be server-side
 */
class RateLimiter {
  constructor(maxRequests, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  isAllowed(identifier) {
    const now = Date.now();
    const entry = this.requests.get(identifier);
    
    if (!entry) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    // Reset if window expired
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + this.windowMs;
      return true;
    }
    
    if (entry.count < this.maxRequests) {
      entry.count++;
      return true;
    }
    
    return false;
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter(60, 60000); // 60 requests per minute
