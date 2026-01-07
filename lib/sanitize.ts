/**
 * Input sanitization utilities
 * Removes HTML tags, scripts, and potentially dangerous content from user input
 */

/**
 * Sanitizes a string by removing HTML tags and potentially dangerous content
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script tags and their content (case insensitive)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: URLs that could be used for XSS
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitizes an object by recursively sanitizing all string values
 * @param obj - The object to sanitize
 * @returns A new object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const sanitized = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitizes a name field (removes HTML but preserves basic characters)
 * @param name - The name to sanitize
 * @returns The sanitized name
 */
export function sanitizeName(name: string | null | undefined): string | null {
  if (!name || typeof name !== 'string') {
    return null;
  }

  // Remove HTML tags
  let sanitized = sanitizeString(name);

  // Remove any remaining special characters that might be dangerous
  // Keep letters, numbers, spaces, and common punctuation
  sanitized = sanitized.replace(/[<>\"'&]/g, '');

  return sanitized.trim() || null;
}

