/**
 * True when the value is normalized to a +E.164-like US phone (+1XXXXXXXXXX).
 */
export function isUsSmsPhone(value) {
  return typeof value === 'string' && value.startsWith('+');
}

/**
 * Shared SMS phone validity check used by derived-state helpers.
 */
export function hasUsSmsPhone(value) {
  return Boolean(value) && isUsSmsPhone(value);
}
