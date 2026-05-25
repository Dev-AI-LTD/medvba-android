import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ListRenderItem } from 'react-native';
import { Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { inputMinHeight, radiusLg, screenPaddingX, space, touchTargetMin, typeScale } from '@/theme/iosDesign';
import Button from '../Button';
import AvatarImage from '../AvatarImage';
import { useTheme } from '@/providers/ThemeProvider';
import type { ChatMessage } from '@/lib/chat';
import type { SocialStackParamList } from '@/lib/navigation';

type Props = NativeStackScreenProps<SocialStackParamList, 'PrivateChat'>;

const MOCK_MESSAGES: ChatMessage[] = [
  { id: '1', fromUserId: 'me', text: 'Hey, ready to study?', createdAt: '12:05' },
  { id: '2', fromUserId: 'peer', text: "Yes, let's start with cranial nerves!", createdAt: '12:06' },
];

export function PrivateChatScreen({ route }: Props) {
  const { peerId, peerName, peerAvatar } = route.params;
  const [input, setInput] = useState('');
  const [messages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const { colors } = useTheme();

  const handleSend = () => {
    if (input.trim()) {
      setInput('');
    }
  };

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => {
    const isMe = item.fromUserId === 'me';
    return (
      <View
        accessibilityLabel={`${isMe ? 'You' : peerName} said: ${item.text}`}
        accessibilityRole="text"
        style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleThem,
          {
            backgroundColor: isMe ? colors.primary : colors.cardBgLight,
            borderColor: isMe ? colors.primary : colors.glassBorder,
          },
        ]}
      >
        <Text 
          variant="bodyMedium" 
          style={[styles.bubbleText, { color: isMe ? colors.inverse : colors.text }]}
        >
          {item.text}
        </Text>
        <Text 
          variant="labelSmall" 
          style={[styles.bubbleTime, { color: isMe ? colors.inverse : colors.textMuted }]}
        >
          {item.createdAt}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="bodyLarge" style={[styles.emptyTitle, { color: colors.textMuted }]}>
        No messages yet
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Start the conversation with {peerName}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Header */}
      <View 
        style={[styles.header, { borderBottomColor: colors.glassBorder }]}
        accessibilityLabel={`Chatting with ${peerName}`}
      >
        <AvatarImage 
          size={36} 
          uri={peerAvatar}
          seed={peerId}
          accessibilityLabel={`${peerName}'s avatar`}
        />
        <Text variant="titleMedium" style={[styles.headerTitle, { color: colors.text }]}>
          {peerName}
        </Text>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, messages.length === 0 && styles.emptyListContent]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        keyboardShouldPersistTaps="handled"
      />

      {/* Input Bar */}
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
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            accessibilityLabel="Message input"
          />
        </View>
        <Button
          title="Send"
          variant="primary"
          onPress={handleSend}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: screenPaddingX,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: space.space3,
    marginBottom: space.space3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    marginLeft: space.space3,
    flex: 1,
  },
  listContent: {
    paddingVertical: space.space3,
    paddingBottom: space.space5,
    flexGrow: 1,
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
  bubble: {
    maxWidth: '75%',
    marginBottom: space.space3,
    paddingHorizontal: space.space4,
    paddingVertical: space.space3,
    borderRadius: radiusLg + 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
  },
  bubbleThem: {
    alignSelf: 'flex-start',
  },
  bubbleText: {
    lineHeight: 22,
  },
  bubbleTime: {
    ...typeScale.caption2,
    marginTop: space.space1,
    textAlign: 'right',
    opacity: 0.7,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: space.space3,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputFieldWrapper: {
    flex: 1,
    marginRight: space.space3,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radiusLg + 4,
    paddingHorizontal: space.space4,
    paddingVertical: space.space3,
    minHeight: inputMinHeight,
    maxHeight: 100,
  },
  sendButton: {
    marginBottom: 0,
    minHeight: touchTargetMin,
  },
});

export default PrivateChatScreen;
