interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const requestMap = new Map<string, RateLimitRecord>();

/**
 * Checks if a request is within rate limit
 * @param key - Identifier (IP, user ID, etc)
 * @param limit - Max requests per window
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = requestMap.get(key);

  // Clean up expired entries
  if (record && now > record.resetTime) {
    requestMap.delete(key);
  }

  const currentRecord = requestMap.get(key);

  if (!currentRecord) {
    requestMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (currentRecord.count >= limit) {
    return false;
  }

  currentRecord.count++;
  return true;
}

/**
 * Clears all rate limit records (useful for testing)
 */
export function clearRateLimits(): void {
  requestMap.clear();
}

/**
 * Gets the size of the rate limit store (for monitoring)
 */
export function getRateLimitStoreSize(): number {
  return requestMap.size;
}
