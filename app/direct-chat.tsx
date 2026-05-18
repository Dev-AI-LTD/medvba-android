import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, router, type Href } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';

/** Legacy route — redirects to tab messenger thread. */
export default function DirectChatRedirect() {
  const { colors } = useTheme();
  const { chatId, peerId, peerName, peerAvatar } = useLocalSearchParams<{
    chatId?: string;
    peerId?: string;
    peerName?: string;
    peerAvatar?: string;
  }>();

  useEffect(() => {
    if (!chatId) {
      router.replace('/(tabs)/social');
      return;
    }
    router.replace({
      pathname: '/(tabs)/social/chat/[chatId]',
      params: {
        chatId,
        peerId: peerId ?? '',
        peerName: peerName ?? 'Student',
        peerAvatar: peerAvatar ?? '',
      },
    } as unknown as Href);
  }, [chatId, peerId, peerName, peerAvatar]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
