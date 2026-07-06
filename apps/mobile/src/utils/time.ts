/** Converts a 12-hour picker value (1-12 + AM/PM) to 24-hour form, e.g. (12, false) -> 0, (12, true) -> 12. */
export const to24Hour = (hour12: number, isAfternoon: boolean): number => {
  if (isAfternoon) return hour12 === 12 ? 12 : hour12 + 12;
  return hour12 === 12 ? 0 : hour12;
};

/** Converts a 24-hour value to a 12-hour picker value, e.g. 0 -> 12 (AM), 13 -> 1 (PM). */
export const to12Hour = (hour24: number): { hour: number; isAfternoon: boolean } => ({
  hour: hour24 % 12 === 0 ? 12 : hour24 % 12,
  isAfternoon: hour24 >= 12,
});

/** Parses a server "HH:mm" string into 12-hour picker parts. Falls back to 12:00 AM on a malformed string. */
export const parseTimeString = (time: string): { hour: number; minute: number; isAfternoon: boolean } => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  const { hour, isAfternoon } = to12Hour(h);
  return { hour, minute: m, isAfternoon };
};

/** Formats 12-hour picker parts back into a server "HH:mm" (24-hour, zero-padded) string. */
export const formatTimeString = (hour12: number, minute: number, isAfternoon: boolean): string => {
  const hour24 = to24Hour(hour12, isAfternoon);
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};
