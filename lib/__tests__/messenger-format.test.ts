import { formatChatListTime, formatMessageTime } from '@/lib/messenger-format';

describe('messenger-format', () => {
  it('formatMessageTime returns HH:MM', () => {
    const iso = new Date(2026, 4, 18, 14, 30).toISOString();
    expect(formatMessageTime(iso)).toMatch(/\d/);
  });

  it('formatChatListTime returns Yesterday for previous day', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(formatChatListTime(d.toISOString())).toBe('Yesterday');
  });
});
