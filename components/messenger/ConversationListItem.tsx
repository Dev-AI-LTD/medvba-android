import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Badge } from 'react-native-paper';
import AvatarImage from '@/components/AvatarImage';
import OnlineIndicator from '@/components/OnlineIndicator';
import { useTheme } from '@/providers/ThemeProvider';
import { formatChatListTime } from '@/lib/messenger-format';
import type { DirectChatSummary } from '@/lib/supabase-hooks';
import { SPACING, listRowMinHeight, screenPaddingX, space } from '@/theme/iosDesign';

type Props = {
  conversation: DirectChatSummary;
  onPress: () => void;
};

export function ConversationListItem({ conversation, onPress }: Props) {
  const { colors } = useTheme();
  const preview =
    conversation.lastMessage.length > 0
      ? conversation.lastMessage
      : '—';

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.glassBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${conversation.peerName}`}
    >
      <View style={styles.avatarWrap}>
        <AvatarImage size={48} uri={conversation.peerAvatar} seed={conversation.peerId} />
        {!conversation.isGroup && (
          <OnlineIndicator
            isOnline={conversation.isOnline}
            size={12}
            style={styles.dot}
          />
        )}
      </View>
      <View style={styles.center}>
        <View style={styles.topRow}>
          <Text variant="titleSmall" numberOfLines={1} style={{ color: colors.text, flex: 1 }}>
            {conversation.peerName}
          </Text>
          {conversation.lastMessageAt ? (
            <Text variant="labelSmall" style={{ color: colors.textMuted }}>
              {formatChatListTime(conversation.lastMessageAt)}
            </Text>
          ) : null}
        </View>
        <View style={styles.bottomRow}>
          <Text
            variant="bodyMedium"
            numberOfLines={1}
            style={[
              styles.preview,
              {
                color: conversation.unreadCount > 0 ? colors.text : colors.textMuted,
                fontWeight: conversation.unreadCount > 0 ? '600' : '400',
              },
            ]}
          >
            {preview}
          </Text>
          {conversation.unreadCount > 0 && (
            <Badge style={[styles.badge, { backgroundColor: colors.primary }]}>
              {conversation.unreadCount}
            </Badge>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPaddingX,
    paddingVertical: space.space2,
    minHeight: listRowMinHeight + space.space2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.x2,
  },
  avatarWrap: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  center: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.x1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: SPACING.x1,
  },
  preview: {
    flex: 1,
  },
  badge: {
    alignSelf: 'center',
  },
});
