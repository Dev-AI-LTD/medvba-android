import {
  isMinuteInQuietHours,
  isStudyTimeBlockedByDnd,
  timeStringToMinutes,
} from '@/lib/dnd-time';

describe('dnd-time', () => {
  test('timeStringToMinutes', () => {
    expect(timeStringToMinutes('09:00')).toBe(9 * 60);
    expect(timeStringToMinutes('22:30')).toBe(22 * 60 + 30);
  });

  test('same-day quiet window', () => {
    expect(isMinuteInQuietHours(12 * 60, 10 * 60, 14 * 60, true)).toBe(true);
    expect(isMinuteInQuietHours(9 * 60, 10 * 60, 14 * 60, true)).toBe(false);
  });

  test('overnight quiet window', () => {
    const start = 22 * 60;
    const end = 8 * 60;
    expect(isMinuteInQuietHours(23 * 60, start, end, true)).toBe(true);
    expect(isMinuteInQuietHours(7 * 60, start, end, true)).toBe(true);
    expect(isMinuteInQuietHours(12 * 60, start, end, true)).toBe(false);
  });

  test('disabled DND', () => {
    expect(isMinuteInQuietHours(23 * 60, 22 * 60, 8 * 60, false)).toBe(false);
  });

  test('isStudyTimeBlockedByDnd', () => {
    expect(isStudyTimeBlockedByDnd('23:00', true, '22:00', '08:00')).toBe(true);
    expect(isStudyTimeBlockedByDnd('12:00', true, '22:00', '08:00')).toBe(false);
    expect(isStudyTimeBlockedByDnd('23:00', false, '22:00', '08:00')).toBe(false);
  });
});
