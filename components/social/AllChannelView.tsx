import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, ListRenderItem } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@/constants/design';
import Button from '../Button';
import AvatarImage from '../AvatarImage';
import { useTheme } from '@/providers/ThemeProvider';
import type { ChannelMessage } from '@/lib/chat';
import type { SocialStackParamList } from '@/lib/navigation';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'SocialMain'>;

const MOCK_MESSAGES: ChannelMessage[] = [];

interface AllChannelViewProps {
  onSendMessage?: (message: string) => void;
}

export function AllChannelView({ onSendMessage }: AllChannelViewProps) {
  const [input, setInput] = useState('');
  const [messages] = useState<ChannelMessage[]>(MOCK_MESSAGES);
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage?.(input.trim());
      setInput('');
    }
  };

  const handleOpenPrivateChat = (userId: string, userName: string, userAvatar: string) => {
    navigation.navigate('PrivateChat', {
      peerId: userId,
      peerName: userName,
      peerAvatar: userAvatar,
    });
  };

  const renderMessage: ListRenderItem<ChannelMessage> = ({ item }) => (
    <View 
      style={styles.messageRow}
      accessibilityLabel={`${item.userName} said: ${item.text}`}
    >
      <AvatarImage 
        size={32} 
        uri={item.userAvatar}
        seed={item.userId}
        accessibilityLabel={`${item.userName}'s avatar`}
      />
      <View style={styles.messageTextContainer}>
        <View style={styles.messageHeaderRow}>
          <Text variant="labelLarge" style={{ color: colors.text }} accessibilityLabel={`Sent by ${item.userName}`}>
            {item.userName}
          </Text>
          <Text variant="labelSmall" style={[styles.timeText, { color: colors.textMuted }]}>
            {item.createdAt}
          </Text>
        </View>
        <Text variant="bodyMedium" style={{ color: colors.text }}>
          {item.text}
        </Text>
        <View style={styles.actionsRow}>
          <Button
            title="Message privately"
            variant="ghost"
            size="small"
            onPress={() => handleOpenPrivateChat(item.userId, item.userName, item.userAvatar)}
          />
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="bodyLarge" style={[styles.emptyTitle, { color: colors.textMuted }]}>
        No messages yet
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Be the first to say hello to the community
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="titleMedium" style={{ color: colors.text }}>
          All channel
        </Text>
        <Text variant="labelMedium" style={[styles.onlineCount, { color: colors.textMuted }]}>
          0 online
        </Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, messages.length === 0 && styles.emptyListContent]}
        renderItem={renderMessage}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Input bar */}
      <View style={[styles.inputBar, { borderTopColor: colors.glassBorder }]}>
        <View style={styles.inputFieldWrapper}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundLight,
                color: colors.text,
                borderColor: colors.glassBorder,
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Write a message to everyone..."
            placeholderTextColor={colors.textMuted}
            multiline
            accessibilityLabel="Channel message input"
          />
        </View>
        <Button
          title="Send"
          variant="primary"
          onPress={handleSend}
          style={styles.sendButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  onlineCount: { opacity: 0.7 },
  listContent: { paddingBottom: spacing.xl },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  messageTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  messageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timeText: { opacity: 0.6 },
  actionsRow: { marginTop: spacing.sm },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputFieldWrapper: {
    flex: 1,
    marginRight: spacing.md,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
    maxHeight: 100,
  },
  sendButton: {
    marginBottom: 0,
  },
});

export default AllChannelView;
