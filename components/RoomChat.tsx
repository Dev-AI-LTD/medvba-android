import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Send, Loader2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import type { AppColors } from '@/constants/colors';
import { useRoomMessages, useSendMessage, RoomMessage } from '@/lib/supabase-hooks';
import { useAuth } from '@/providers/AuthProvider';
import { safeAvatarUri } from '@/lib/safe-image-uri';
import {
  screenPaddingX,
  touchTargetMin,
  space,
  radiusMd,
  radiusLg,
  typeScale,
  iconSm,
  inputHeight,
  radiusPill,
  hitSlop,
} from '@/theme/iosDesign';

interface RoomChatProps {
  roomId: string;
  roomName: string;
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function RoomChat({ roomId, roomName }: RoomChatProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, profile } = useAuth();
  const { messages, isLoading } = useRoomMessages(roomId);
  const sendMessageMutation = useSendMessage();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !user || !profile) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    sendMessageMutation.mutate({
      roomId,
      userId: user.id,
      message: messageText.trim(),
    }, {
      onSuccess: () => {
        setMessageText('');
      },
      onError: (error) => {
        console.error('Failed to send message:', error);
      },
    });
  };

  const renderMessage = ({ item, index }: { item: RoomMessage; index: number }) => {
    const isOwnMessage = item.userId === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.userId !== item.userId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && showAvatar ? (
          <Image
            source={{ uri: safeAvatarUri(item.userAvatar, item.userId) }}
            style={styles.messageAvatar}
          />
        ) : (
          !isOwnMessage && <View style={styles.messageAvatarPlaceholder} />
        )}
        
        <View style={styles.messageContent}>
          {!isOwnMessage && showAvatar && (
            <Text style={styles.messageSender}>{item.userName}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.message}
            </Text>
          </View>
          <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{roomName}</Text>
        <Text style={styles.headerSubtitle}>
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Be the first to say hello! 👋</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sendMessageMutation.isPending}
          hitSlop={hitSlop.default}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          {sendMessageMutation.isPending ? (
            <Loader2 color={colors.text} size={iconSm} />
          ) : (
            <Send color={colors.text} size={iconSm} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      ...typeScale.subhead,
      color: colors.textSecondary,
      marginTop: space.space3,
    },
    header: {
      paddingHorizontal: screenPaddingX,
      paddingVertical: space.space4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.cardBgLight,
      backgroundColor: colors.cardBg,
    },
    headerTitle: {
      ...typeScale.headline,
      color: colors.text,
    },
    headerSubtitle: {
      ...typeScale.footnote,
      color: colors.textSecondary,
      marginTop: space.space1,
    },
    messagesList: {
      paddingHorizontal: screenPaddingX,
      paddingVertical: space.space3,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: space.space9,
    },
    emptyText: {
      ...typeScale.body,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: space.space1,
    },
    emptySubtext: {
      ...typeScale.subhead,
      color: colors.textMuted,
    },
    messageContainer: {
      flexDirection: 'row',
      marginBottom: space.space3,
      alignItems: 'flex-end',
    },
    ownMessageContainer: {
      justifyContent: 'flex-end',
    },
    otherMessageContainer: {
      justifyContent: 'flex-start',
    },
    messageAvatar: {
      width: touchTargetMin - 12,
      height: touchTargetMin - 12,
      borderRadius: (touchTargetMin - 12) / 2,
      marginRight: space.space2,
    },
    messageAvatarPlaceholder: {
      width: touchTargetMin - 12,
      marginRight: space.space2,
    },
    messageContent: {
      maxWidth: '75%',
    },
    messageSender: {
      ...typeScale.captionMedium,
      color: colors.textSecondary,
      marginBottom: space.space1,
      marginLeft: space.space3,
    },
    messageBubble: {
      paddingHorizontal: screenPaddingX,
      paddingVertical: space.space2 + 2,
      borderRadius: radiusLg + 2,
    },
    ownMessageBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: space.space1,
      alignSelf: 'flex-end',
    },
    otherMessageBubble: {
      backgroundColor: colors.cardBgLight,
      borderBottomLeftRadius: space.space1,
    },
    messageText: {
      ...typeScale.subhead,
    },
    ownMessageText: {
      color: colors.text,
    },
    otherMessageText: {
      color: colors.text,
    },
    messageTime: {
      ...typeScale.caption2,
      color: colors.textMuted,
      marginTop: space.space1,
      marginLeft: space.space3,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: screenPaddingX,
      paddingVertical: space.space3,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.cardBgLight,
      backgroundColor: colors.cardBg,
      gap: space.space2,
    },
    input: {
      flex: 1,
      backgroundColor: colors.cardBgLight,
      borderRadius: radiusPill,
      paddingHorizontal: space.space4,
      paddingVertical: space.space2 + 2,
      ...typeScale.subhead,
      color: colors.text,
      minHeight: inputHeight,
      maxHeight: 100,
    },
    sendButton: {
      width: touchTargetMin,
      height: touchTargetMin,
      borderRadius: touchTargetMin / 2,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.cardBgLight,
      opacity: 0.5,
    },
  });
}
