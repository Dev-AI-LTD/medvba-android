import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/providers/ThemeProvider';
import { formatMessageTime } from '@/lib/messenger-format';
import type { DirectChatMessage } from '@/lib/supabase-hooks';
import { radiusLg, screenPaddingX, space, SPACING } from '@/theme/iosDesign';

type Props = {
  messages: DirectChatMessage[];
  currentUserId: string;
  isLoading?: boolean;
  keyboardInset?: number;
  onRegisterScrollToEnd?: (scrollToEnd: () => void) => void;
};

export function ChatThread({
  messages,
  currentUserId,
  isLoading,
  keyboardInset = 0,
  onRegisterScrollToEnd,
}: Props) {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<DirectChatMessage>>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => {
    onRegisterScrollToEnd?.(scrollToEnd);
  }, [onRegisterScrollToEnd, scrollToEnd]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToEnd();
    }
  }, [messages.length, scrollToEnd]);

  useEffect(() => {
    if (keyboardInset > 0) {
      scrollToEnd();
    }
  }, [keyboardInset, scrollToEnd]);

  const renderItem: ListRenderItem<DirectChatMessage> = ({ item, index }) => {
    const isMe = item.userId === currentUserId;
    const prev = index > 0 ? messages[index - 1] : null;
    const showTime =
      !prev ||
      new Date(item.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;

    return (
      <View style={styles.itemWrap}>
        {showTime && (
          <Text variant="labelSmall" style={[styles.timeCenter, { color: colors.textMuted }]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        )}
        <View style={[styles.row, isMe && styles.rowMe]}>
          <View
            style={[
              styles.bubble,
              isMe
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.cardBgLight, borderColor: colors.glassBorder, borderWidth: 1 },
            ]}
          >
            <Text
              variant="bodyMedium"
              style={{ color: isMe ? colors.inverse : colors.text }}
            >
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={[
        styles.list,
        keyboardInset > 0 ? { paddingBottom: SPACING.x2 + 8 } : undefined,
      ]}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: screenPaddingX,
    paddingVertical: space.space4,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemWrap: {
    marginBottom: space.space2,
  },
  timeCenter: {
    textAlign: 'center',
    marginVertical: space.space2,
  },
  row: {
    flexDirection: 'row',
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radiusLg + 2,
    paddingHorizontal: space.space4,
    paddingVertical: space.space3,
  },
});
