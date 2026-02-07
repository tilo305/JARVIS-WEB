/**
 * Security Validation Utilities
 * Based on OWASP Top 10, Building Secure and Reliable Systems, and security best practices
 * 
 * Provides comprehensive input validation, sanitization, and security checks
 */

/**
 * Allowed file MIME types for uploads
 * Based on OWASP file upload security guidelines
 */
export const ALLOWED_MIME_TYPES = {
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
} as const;

/**
 * Maximum file size limits (in bytes)
 */
export const MAX_FILE_SIZES = {
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
} as const;

/**
 * Dangerous file extensions that should never be allowed
 * Based on OWASP file upload security guidelines
 */
export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.sh', '.ps1', '.dll', '.msi', '.app', '.deb', '.rpm', '.dmg',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.cgi',
] as const;

/**
 * Validates file magic bytes against expected MIME type
 * Prevents MIME type spoofing attacks
 */
export function validateFileMagicBytes(
  fileBuffer: ArrayBuffer | Uint8Array,
  expectedMimeType: string
): boolean {
  const magicBytes = ALLOWED_MIME_TYPES[expectedMimeType as keyof typeof ALLOWED_MIME_TYPES];
  
  if (!magicBytes) {
    // Plain text doesn't have magic bytes, allow it
    return expectedMimeType === 'text/plain';
  }
  
  const buffer = fileBuffer instanceof ArrayBuffer 
    ? new Uint8Array(fileBuffer.slice(0, magicBytes.length))
    : fileBuffer.slice(0, magicBytes.length);
  
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
export function isDangerousExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return DANGEROUS_EXTENSIONS.includes(ext as typeof DANGEROUS_EXTENSIONS[number]);
}

/**
 * Validates file size against configured limits
 */
export function validateFileSize(size: number, mimeType: string): boolean {
  const maxSize = MAX_FILE_SIZES[mimeType as keyof typeof MAX_FILE_SIZES] 
    || MAX_FILE_SIZES.default;
  return size <= maxSize;
}

/**
 * Validates MIME type is in allowed list
 */
export function isValidMimeType(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME_TYPES;
}

/**
 * Comprehensive file validation
 * Implements defense in depth: extension, MIME type, magic bytes, size
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateFile(
  file: File,
  options: {
    checkMagicBytes?: boolean;
    strictMimeType?: boolean;
  } = {}
): Promise<FileValidationResult> {
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
    const maxSize = MAX_FILE_SIZES[file.type as keyof typeof MAX_FILE_SIZES] 
      || MAX_FILE_SIZES.default;
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
        error: `Failed to validate file magic bytes: ${err instanceof Error ? err.message : 'Unknown error'}`,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Sanitizes filename to prevent path traversal and injection attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  let sanitized = filename.replace(/[/\\]/g, '_');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters (necessary for security - control chars can be dangerous)
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
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  const map: Record<string, string> = {
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
export function isValidUrl(url: string, allowedDomains?: string[]): boolean {
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
export function sanitizeWebhookResponse(response: unknown): unknown {
  if (typeof response === 'string') {
    return sanitizeHtml(response);
  }
  
  if (Array.isArray(response)) {
    return response.map(item => sanitizeWebhookResponse(item));
  }
  
  if (response && typeof response === 'object') {
    const sanitized: Record<string, unknown> = {};
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
 * Rate limiting token bucket implementation
 */
export class RateLimiter {
  private tokens: Map<string, { tokens: number; lastRefill: number }> = new Map();
  
  constructor(
    private readonly maxTokens: number,
    private readonly refillRate: number, // tokens per second
    private readonly windowMs: number = 60000 // 1 minute default
  ) {}
  
  /**
   * Check if request should be allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.tokens.get(identifier);
    
    if (!entry) {
      this.tokens.set(identifier, { tokens: this.maxTokens - 1, lastRefill: now });
      return true;
    }
    
    // Refill tokens based on time passed
    const timePassed = (now - entry.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      entry.tokens = Math.min(this.maxTokens, entry.tokens + tokensToAdd);
      entry.lastRefill = now;
    }
    
    if (entry.tokens > 0) {
      entry.tokens--;
      return true;
    }
    
    return false;
  }
  
  /**
   * Get remaining tokens for identifier
   */
  getRemainingTokens(identifier: string): number {
    const entry = this.tokens.get(identifier);
    return entry ? entry.tokens : this.maxTokens;
  }
  
  /**
   * Clean up old entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.tokens.entries()) {
      if (now - entry.lastRefill > this.windowMs) {
        this.tokens.delete(key);
      }
    }
  }
}
