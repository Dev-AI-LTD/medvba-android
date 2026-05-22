import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_REPORTS_STORAGE_KEY = '@medvba_user_reports';

export type UserReportReason = 'harassment' | 'inappropriate' | 'spam' | 'other';

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: UserReportReason;
  chatId?: string;
  createdAt: string;
}

export async function loadUserReportsFromStorage(): Promise<UserReport[]> {
  try {
    const raw = await AsyncStorage.getItem(USER_REPORTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as UserReport[]) : [];
  } catch {
    return [];
  }
}

export async function addUserReport(entry: Omit<UserReport, 'id' | 'createdAt'>): Promise<UserReport> {
  const list = await loadUserReportsFromStorage();
  const report: UserReport = {
    ...entry,
    id: `${Date.now()}-${entry.reportedUserId}`,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(USER_REPORTS_STORAGE_KEY, JSON.stringify([report, ...list]));
  return report;
}
