/**
 * Quick Command Parser for schedule blocks
 * Parses commands like /d930, /m1430, etc.
 */

export interface QuickCommand {
  type: 'deep-work' | 'meeting' | 'admin' | 'break' | 'personal';
  time: string;
  label: string;
  duration: number; // Duration in minutes
  isCustomName?: boolean; // Whether this uses a custom name
}

const blockTypeMap: Record<string, { type: string; label: string; duration: number }> = {
  'd': { type: 'deep-work', label: 'Deep Work', duration: 90 },
  'm': { type: 'meeting', label: 'Meeting', duration: 60 },
  'a': { type: 'admin', label: 'Admin', duration: 45 },
  'b': { type: 'break', label: 'Break', duration: 15 },
  'p': { type: 'personal', label: 'Personal', duration: 60 },
  'w': { type: 'personal', label: 'Workout', duration: 45 }, // Workout uses personal type
  // 'e' is reserved for event selection
};

/**
 * Parse time from various formats
 * 9 -> 09:00
 * 930 -> 09:30
 * 1430 -> 14:30
 * 14 -> 14:00
 */
function parseTime(timeStr: string): string | null {
  if (!timeStr) return null;
  
  // Remove any non-digits
  const digits = timeStr.replace(/\D/g, '');
  
  if (digits.length === 1) {
    // Single digit: 9 -> 09:00
    return `0${digits}:00`;
  } else if (digits.length === 2) {
    // Two digits: 14 -> 14:00, 09 -> 09:00
    const hour = parseInt(digits);
    if (hour >= 0 && hour <= 23) {
      return `${digits}:00`;
    }
  } else if (digits.length === 3) {
    // Three digits: 930 -> 09:30, 130 -> 01:30
    const hour = parseInt(digits[0]);
    const minutes = digits.substring(1);
    if (hour >= 0 && hour <= 9 && parseInt(minutes) <= 59) {
      return `0${hour}:${minutes}`;
    }
  } else if (digits.length === 4) {
    // Four digits: 1430 -> 14:30, 0930 -> 09:30
    const hours = digits.substring(0, 2);
    const minutes = digits.substring(2);
    const hour = parseInt(hours);
    const min = parseInt(minutes);
    if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
      return `${hours}:${minutes}`;
    }
  }
  
  return null;
}

/**
 * Parse a quick command like d930 or m1430 (no slash needed)
 * Returns null if not a valid quick command
 *
 * STRICT MATCHING: No spaces allowed. Commands must be continuous.
 * Examples: d930 ✓, m14 ✓, a ✓, d 930 ✗, do 930 ✗
 */
export function parseQuickCommand(input: string): QuickCommand | null {
  // Don't require slash - work with direct input
  const command = input.startsWith('/') ? input.substring(1) : input;

  // Must have at least one character
  if (command.length === 0) return null;

  // STRICT: No spaces allowed in quick commands
  if (command.includes(' ')) return null;

  // First character should be a block type
  const typeChar = command[0].toLowerCase();
  const blockType = blockTypeMap[typeChar];

  if (!blockType) return null;

  // Rest is optional time
  const timeStr = command.substring(1);

  // If no time specified, use current time rounded to next 15 minutes
  let time: string;
  if (!timeStr) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    if (minutes === 60) {
      time = `${(hours + 1).toString().padStart(2, '0')}:00`;
    } else {
      time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  } else {
    const parsedTime = parseTime(timeStr);
    if (!parsedTime) return null;
    time = parsedTime;
  }

  return {
    type: blockType.type as any,
    time,
    label: blockType.label,
    duration: blockType.duration,
  };
}

/**
 * Parse enhanced command with custom name support
 * Supports patterns like:
 * - "d Morning planning 930" → Deep Work named "Morning planning" at 9:30
 * - "d Morning planning" → Deep Work named "Morning planning" at smart time
 * - "Morning planning 930" → Admin named "Morning planning" at 9:30
 * - "Morning planning" → Admin named "Morning planning" at smart time
 */
export function parseEnhancedCommand(input: string, smartTime?: string): QuickCommand | null {
  const command = input.startsWith('/') ? input.substring(1) : input;

  if (!command || !command.includes(' ')) return null; // Enhanced commands must have spaces

  const parts = command.split(' ');

  // Check if first character is a block type
  const firstChar = parts[0][0].toLowerCase();
  const hasTypePrefix = firstChar in blockTypeMap && parts[0].length === 1;

  let blockType: { type: string; label: string; duration: number };
  let nameParts: string[];
  let timeStr: string | null = null;

  if (hasTypePrefix) {
    // Pattern: "d Morning planning 930" or "d Morning planning"
    blockType = blockTypeMap[firstChar];
    nameParts = parts.slice(1); // Everything after type char
  } else {
    // Pattern: "Morning planning 930" or "Morning planning"
    blockType = blockTypeMap['a']; // Default to admin
    nameParts = parts;
  }

  // Check if last part is a time
  const lastPart = nameParts[nameParts.length - 1];
  const parsedTime = parseTime(lastPart);

  if (parsedTime) {
    // Last part is a time
    timeStr = parsedTime;
    nameParts = nameParts.slice(0, -1); // Remove time from name parts
  }

  // Join remaining parts as the custom name
  const customName = nameParts.join(' ').trim();

  if (!customName) return null; // Must have a name

  // Determine final time
  let finalTime: string;
  if (timeStr) {
    finalTime = timeStr;
  } else if (smartTime) {
    finalTime = smartTime;
  } else {
    // Use current time rounded to next 15 minutes
    const now = new Date();
    const hours = now.getHours();
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    if (minutes === 60) {
      finalTime = `${(hours + 1).toString().padStart(2, '0')}:00`;
    } else {
      finalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  return {
    type: blockType.type as any,
    time: finalTime,
    label: customName,
    duration: blockType.duration,
    isCustomName: true,
  };
}

/**
 * Check if input is potentially a quick command (for showing hints)
 */
export function isQuickCommand(input: string): boolean {
  // Don't require slash
  const command = input.startsWith('/') ? input.substring(1) : input;
  if (command.length === 0) return false;

  // STRICT: No spaces allowed in quick commands
  if (command.includes(' ')) return false;

  // Check if first character is a valid block type
  const typeChar = command[0].toLowerCase();
  return typeChar in blockTypeMap;
}

/**
 * Get command hints based on current input
 */
export function getQuickCommandHints(input: string): string[] {
  const hints: string[] = [];
  
  if (input === '/') {
    // Show all quick command examples
    hints.push('/d930 → Deep work at 9:30');
    hints.push('/m14 → Meeting at 14:00');
    hints.push('/a → Admin block now');
  } else if (input.startsWith('/')) {
    const parsed = parseQuickCommand(input);
    if (parsed) {
      hints.push(`→ ${parsed.label} at ${parsed.time}`);
    }
  }
  
  return hints;
}