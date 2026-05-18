import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@medvba_chat_last_read:';

export async function getChatLastReadAt(chatId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`${PREFIX}${chatId}`);
  } catch {
    return null;
  }
}

export async function setChatLastReadAt(chatId: string, iso: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${PREFIX}${chatId}`, iso);
  } catch {
    /* best effort */
  }
}
