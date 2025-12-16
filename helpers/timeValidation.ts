// helpers/timeValidation.ts
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

export const isTimeWithinRange = (
  timeStr: string,
  rangeStart: string,
  rangeEnd: string
): boolean => {
  const time = timeToMinutes(timeStr);
  const start = timeToMinutes(rangeStart);
  const end = timeToMinutes(rangeEnd);
  return time >= start && time <= end;
};

export const doTimesOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean => {
  // Note: if one range ends exactly when the other starts,
  // they do not overlap.
  return (
    timeToMinutes(startA) < timeToMinutes(endB) &&
    timeToMinutes(endA) > timeToMinutes(startB)
  );
};

// A generic validation for a time range against an allowed window and existing blocks.
export const validateTimeRange = (
  newTime: { startTime: string; endTime: string },
  existingBlocks: {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
  }[],
  allowedStart: string,
  allowedEnd: string
): string | null => {
  if (timeToMinutes(newTime.startTime) >= timeToMinutes(newTime.endTime)) {
    return "Start time must be before end time.";
  }
  if (
    !isTimeWithinRange(newTime.startTime, allowedStart, allowedEnd) ||
    !isTimeWithinRange(newTime.endTime, allowedStart, allowedEnd)
  ) {
    return "Times must be within the allowed schedule.";
  }
  // Check for overlap against each existing block.
  for (const block of existingBlocks) {
    if (
      doTimesOverlap(
        newTime.startTime,
        newTime.endTime,
        block.startTime,
        block.endTime
      )
    ) {
      return `Time overlaps with block "${block.name}" (${block.startTime} - ${block.endTime}).`;
    }
  }
  return null;
};
