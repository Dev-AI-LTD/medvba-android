import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Screen } from '@/components/layout';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useKeyboardHeight } from '@/lib/use-keyboard-height';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AvatarImage from '@/components/AvatarImage';
import OnlineIndicator from '@/components/OnlineIndicator';
import { ChatThread } from '@/components/messenger/ChatThread';
import { ChatComposer } from '@/components/messenger/ChatComposer';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import {
  useDirectChatMessages,
  useSendDirectMessage,
  useOnlineFriends,
} from '@/lib/supabase-hooks';
import { setChatLastReadAt } from '@/lib/messenger-read-state';
import { addBlockedUserEntry } from '@/lib/blocked-users-storage';
import {
  SPACING,
  iconLg,
  iconXl,
  listRowMinHeight,
  screenPaddingX,
  touchTargetMin,
} from '@/theme/iosDesign';

export default function ChatThreadScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const params = useLocalSearchParams<{
    chatId: string;
    peerId: string;
    peerName: string;
    peerAvatar: string;
  }>();

  const chatId = params.chatId ?? '';
  const peerId = params.peerId ?? '';
  const peerName = params.peerName ?? t('messenger.unknownUser');
  const peerAvatar = params.peerAvatar ?? '';

  const [draft, setDraft] = useState('');
  const tabBarHeight = useBottomTabBarHeight();
  const keyboardHeight = useKeyboardHeight();
  const scrollToEndRef = useRef<(() => void) | null>(null);
  const { messages, isLoading } = useDirectChatMessages(chatId);
  const sendMessage = useSendDirectMessage();
  const isProfilePublic = profile?.isPublic !== false;
  const onlineQuery = useOnlineFriends(isProfilePublic ? user?.id : undefined);
  const isPeerOnline = (onlineQuery.data ?? []).some((u) => u.id === peerId);

  useEffect(() => {
    if (chatId && messages.length > 0) {
      void setChatLastReadAt(chatId, new Date().toISOString());
    }
  }, [chatId, messages.length]);

  useEffect(() => {
    if (keyboardHeight > 0) {
      scrollToEndRef.current?.();
    }
  }, [keyboardHeight]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !user?.id || !chatId) return;
    sendMessage.mutate(
      { chatId, userId: user.id, content: text },
      {
        onSuccess: () => {
          setDraft('');
          void setChatLastReadAt(chatId, new Date().toISOString());
        },
      },
    );
  }, [draft, user?.id, chatId, sendMessage]);

  const handleBlock = useCallback(() => {
    Alert.alert(
      t('social.blockUserTitle'),
      t('social.blockConfirmMessage').replace('{name}', peerName),
      [
        { text: t('social.cancel'), style: 'cancel' },
        {
          text: t('social.blockUser'),
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await addBlockedUserEntry({ id: peerId, name: peerName, avatar: peerAvatar });
            router.back();
          },
        },
      ],
    );
  }, [t, peerName, peerId, peerAvatar, router]);

  const handleMenu = useCallback(() => {
    Alert.alert(peerName, undefined, [
      { text: t('social.cancel'), style: 'cancel' },
      { text: t('social.blockUser'), style: 'destructive', onPress: handleBlock },
    ]);
  }, [peerName, t, handleBlock]);

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('messenger.backToChats')}
        >
          <ChevronLeft color={colors.primary} size={iconXl} />
          <Text variant="labelLarge" style={{ color: colors.primary }} numberOfLines={1}>
            {t('messenger.backToChats')}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.avatarWrap}>
            <AvatarImage size={40} uri={peerAvatar} seed={peerId} />
            <OnlineIndicator isOnline={isPeerOnline} size={10} style={styles.dot} />
          </View>
          <View>
            <Text variant="titleMedium" style={{ color: colors.text }} numberOfLines={1}>
              {peerName}
            </Text>
            <Text variant="labelSmall" style={{ color: colors.textMuted }}>
              {isPeerOnline ? t('messenger.online') : t('messenger.offline')}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleMenu}
          style={styles.menuBtn}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <MoreVertical color={colors.text} size={iconLg} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'web' ? undefined : 'padding'}
        keyboardVerticalOffset={tabBarHeight}
        enabled={Platform.OS !== 'web'}
      >
        <ChatThread
          messages={messages}
          currentUserId={user?.id ?? ''}
          isLoading={isLoading}
          keyboardInset={keyboardHeight}
          onRegisterScrollToEnd={(fn) => {
            scrollToEndRef.current = fn;
          }}
        />
        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          placeholder={t('messenger.typeMessage')}
          disabled={sendMessage.isPending}
          onFocus={() => scrollToEndRef.current?.()}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPaddingX,
    paddingVertical: SPACING.x1,
    minHeight: listRowMinHeight + SPACING.x2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargetMin,
    paddingRight: SPACING.x1,
    maxWidth: '38%',
  },
  menuBtn: {
    width: touchTargetMin,
    height: touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.x1,
    minWidth: 0,
  },
  avatarWrap: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
