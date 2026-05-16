/**
 * "HH:mm" → minutes since midnight [0, 24 * 60).
 */
export function timeStringToMinutes(hhmm: string): number {
  const parts = hhmm.split(':').map((p) => parseInt(p, 10));
  const h = Number.isFinite(parts[0]) ? parts[0] : 0;
  const m = Number.isFinite(parts[1]) ? parts[1] : 0;
  const clampedH = Math.min(23, Math.max(0, h));
  const clampedM = Math.min(59, Math.max(0, m));
  return clampedH * 60 + clampedM;
}

/**
 * Whether `minuteOfDay` falls inside quiet hours.
 * Overnight window when start > end (e.g. 22:00–08:00).
 */
export function isMinuteInQuietHours(
  minuteOfDay: number,
  quietStart: number,
  quietEnd: number,
  enabled: boolean
): boolean {
  if (!enabled) return false;
  const start = ((quietStart % (24 * 60)) + 24 * 60) % (24 * 60);
  const end = ((quietEnd % (24 * 60)) + 24 * 60) % (24 * 60);
  const m = ((minuteOfDay % (24 * 60)) + 24 * 60) % (24 * 60);

  if (start === end) {
    return false;
  }

  if (start < end) {
    return m >= start && m < end;
  }
  return m >= start || m < end;
}

export function isStudyTimeBlockedByDnd(
  studyTimeHHmm: string,
  dndEnabled: boolean,
  dndStartHHmm: string,
  dndEndHHmm: string
): boolean {
  return isMinuteInQuietHours(
    timeStringToMinutes(studyTimeHHmm),
    timeStringToMinutes(dndStartHHmm),
    timeStringToMinutes(dndEndHHmm),
    dndEnabled
  );
}
