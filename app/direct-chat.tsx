import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Send, Loader2, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import AvatarImage from '@/components/AvatarImage';
import { useDirectChatMessages, useSendDirectMessage, DirectChatMessage } from '@/lib/supabase-hooks';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';

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

export default function DirectChat() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { chatId, chatTitle } = useLocalSearchParams<{ chatId: string; chatTitle?: string }>();
  const { user } = useAuth();
  const { messages, isLoading } = useDirectChatMessages(chatId);
  const sendMessageMutation = useSendDirectMessage();
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
    if (!messageText.trim() || !user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    sendMessageMutation.mutate({
      chatId: chatId!,
      userId: user.id,
      content: messageText.trim(),
    }, {
      onSuccess: () => {
        setMessageText('');
      },
      onError: () => {
        Alert.alert(t('chat.sendErrorTitle'), t('chat.sendErrorMessage'));
      },
    });
  };

  const renderMessage = ({ item, index }: { item: DirectChatMessage; index: number }) => {
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
          <AvatarImage uri={item.userAvatar} size={32} seed={item.userId} style={styles.messageAvatarStyle} />
        ) : (
          !isOwnMessage && <View style={styles.messageAvatarPlaceholder} />
        )}
        
        <View style={styles.messageContent}>
          {!isOwnMessage && showAvatar && (
            <Text style={[styles.messageSender, { color: colors.textSecondary }]}>
              {item.userName}
            </Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isOwnMessage 
                ? { ...styles.ownMessageBubble, backgroundColor: colors.primary } 
                : { ...styles.otherMessageBubble, backgroundColor: colors.cardBgLight },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: colors.text },
              ]}
            >
              {item.content}
            </Text>
          </View>
          <Text style={[styles.messageTime, { color: colors.textMuted }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: chatTitle || 'Chat',
            headerStyle: { backgroundColor: colors.cardBg },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('chat.loadingChat')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: chatTitle || 'Chat',
          headerStyle: { backgroundColor: colors.cardBg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBackButton}
            >
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('chat.noMessages')}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                {t('chat.startConversation')}
              </Text>
            </View>
          }
        />

        <View style={[styles.inputContainer, { 
          borderTopColor: colors.cardBgLight,
          backgroundColor: colors.cardBg,
        }]}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.cardBgLight,
              color: colors.text,
            }]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder={t('chat.messagePlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              (!messageText.trim() || sendMessageMutation.isPending) && 
                { ...styles.sendButtonDisabled, backgroundColor: colors.cardBgLight },
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 color={colors.text} size={20} />
            ) : (
              <Send color={colors.text} size={20} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    marginTop: 12,
  },
  headerBackButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageAvatarStyle: {
    marginRight: 8,
  },
  messageAvatarPlaceholder: {
    width: 32,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '75%',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
