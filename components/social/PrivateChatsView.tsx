import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ListRenderItem } from 'react-native';
import { Text, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { listRowMinHeight, screenPaddingX, space, touchTargetMin } from '@/theme/iosDesign';
import AvatarImage from '../AvatarImage';
import OnlineIndicator from '../OnlineIndicator';
import { useTheme } from '@/providers/ThemeProvider';
import type { ConversationSummary } from '@/lib/chat';
import type { SocialStackParamList } from '@/lib/navigation';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'SocialMain'>;

const MOCK_CONVERSATIONS: ConversationSummary[] = [];

interface PrivateChatsViewProps {
  onOpenChat?: (conversationId: string, peerId: string) => void;
}

export function PrivateChatsView({ onOpenChat }: PrivateChatsViewProps) {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();

  const handleOpenChat = (conversation: ConversationSummary) => {
    onOpenChat?.(conversation.id, conversation.peerId);
    navigation.navigate('PrivateChat', {
      conversationId: conversation.id,
      peerId: conversation.peerId,
      peerName: conversation.peerName,
      peerAvatar: conversation.peerAvatar,
    });
  };

  const renderConversation: ListRenderItem<ConversationSummary> = ({ item }) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.glassBorder }]}
      onPress={() => handleOpenChat(item)}
      activeOpacity={0.7}
      accessibilityLabel={`Chat with ${item.peerName}: ${item.lastMessage}`}
      accessibilityRole="button"
    >
      <View style={styles.avatarContainer}>
        <AvatarImage 
          size={44} 
          uri={item.peerAvatar}
          seed={item.peerId}
          accessibilityLabel={`${item.peerName}'s avatar`}
        />
        <OnlineIndicator isOnline={item.isOnline} size={12} style={styles.onlineDot} />
      </View>
      <View style={styles.center}>
        <View style={styles.nameRow}>
          <Text variant="bodyMedium" style={{ color: colors.text }}>
            {item.peerName}
          </Text>
          {item.unreadCount > 0 && (
            <Badge style={[styles.badge, { backgroundColor: colors.primary }]}>
              {item.unreadCount}
            </Badge>
          )}
        </View>
        <Text
          variant="bodySmall"
          numberOfLines={1}
          style={[styles.lastMessage, { color: colors.textMuted }]}
        >
          {item.lastMessage}
        </Text>
      </View>
      <View style={styles.right}>
        <Text variant="labelSmall" style={[styles.time, { color: colors.textMuted }]}>
          {item.lastAt}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="bodyLarge" style={[styles.emptyTitle, { color: colors.textMuted }]}>
        No conversations yet
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Start chatting with other medical students
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={[styles.title, { color: colors.text }]}>
        Private chats
      </Text>

      <FlatList
        data={MOCK_CONVERSATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: space.space3 }} />}
        contentContainerStyle={[styles.listContent, MOCK_CONVERSATIONS.length === 0 && styles.emptyListContent]}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { marginBottom: space.space3 },
  listContent: {
    paddingBottom: space.space4,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: space.space5,
  },
  emptyTitle: {
    marginBottom: space.space2,
  },
  emptySubtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.space3,
    paddingHorizontal: screenPaddingX,
    minHeight: Math.max(listRowMinHeight, touchTargetMin),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarContainer: {
    position: 'relative',
  },
  center: {
    flex: 1,
    marginHorizontal: space.space3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.space1,
  },
  lastMessage: { opacity: 0.8 },
  right: {
    alignItems: 'flex-end',
  },
  time: { opacity: 0.6, marginBottom: space.space1 },
  badge: {
    marginLeft: space.space2,
    minWidth: touchTargetMin - 24,
    minHeight: touchTargetMin - 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default PrivateChatsView;
