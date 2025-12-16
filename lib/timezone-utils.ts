/**
 * Utility functions for handling timezone conversions
 */

/**
 * Convert a local datetime input string to UTC ISO string
 * The input is from <input type="datetime-local"> which doesn't include timezone
 * We need to treat it as local time and convert to UTC
 */
export function localDateTimeToUTC(localDateTime: string): string {
  if (!localDateTime) return '';
  
  // For datetime-local inputs, the browser gives us a string like "2025-07-24T17:41"
  // We need to explicitly treat this as local time
  // Create a date object and it will be interpreted as local time
  const localDate = new Date(localDateTime);
  
  // toISOString() converts to UTC
  return localDate.toISOString();
}

/**
 * Convert UTC ISO string to local datetime string for input field
 * Returns format suitable for <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
 */
export function utcToLocalDateTime(utcString: string): string {
  if (!utcString) return '';
  
  const date = new Date(utcString);
  
  // Get local date components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // Return in the format expected by datetime-local input
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get timezone offset in hours from UTC
 */
export function getTimezoneOffset(): number {
  const offsetMinutes = new Date().getTimezoneOffset();
  return -offsetMinutes / 60; // Negative because getTimezoneOffset returns opposite sign
}

/**
 * Format a date showing both local time and UTC
 */
export function formatDateWithTimezone(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const localTime = d.toLocaleString();
  const utcTime = d.toUTCString();
  return `${localTime} (UTC: ${utcTime})`;
}