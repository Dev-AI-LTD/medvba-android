import AsyncStorage from '@react-native-async-storage/async-storage';

export const BLOCKED_USERS_STORAGE_KEY = '@medvba_blocked_users';

export interface BlockedUser {
  id: string;
  name: string;
  avatar: string;
  blockedAt: string;
}

export async function loadBlockedUsersFromStorage(): Promise<BlockedUser[]> {
  try {
    const raw = await AsyncStorage.getItem(BLOCKED_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as BlockedUser[]) : [];
  } catch {
    return [];
  }
}

export async function persistBlockedUsers(users: BlockedUser[]): Promise<void> {
  await AsyncStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(users));
}

export async function addBlockedUserEntry(user: {
  id: string;
  name: string;
  avatar: string;
}): Promise<BlockedUser[]> {
  const list = await loadBlockedUsersFromStorage();
  const entry: BlockedUser = {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    blockedAt: new Date().toISOString(),
  };
  const next = [...list.filter((u) => u.id !== user.id), entry];
  await persistBlockedUsers(next);
  return next;
}

export async function removeBlockedUserById(userId: string): Promise<BlockedUser[]> {
  const list = await loadBlockedUsersFromStorage();
  const next = list.filter((u) => u.id !== userId);
  await persistBlockedUsers(next);
  return next;
}
