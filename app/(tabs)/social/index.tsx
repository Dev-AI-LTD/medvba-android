import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter, type Href } from 'expo-router';
import { Search, UserPlus } from 'lucide-react-native';
import { Screen, ScreenHeader } from '@/components/layout';
import { OfflineFeatureNotice } from '@/components/OfflineFeatureNotice';
import { ActiveMembersRow, type ActiveMember } from '@/components/messenger/ActiveMembersRow';
import { ConversationListItem } from '@/components/messenger/ConversationListItem';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import {
  useDirectChats,
  useGetOrCreateDirectChat,
  useOnlineFriends,
  type DirectChatSummary,
} from '@/lib/supabase-hooks';
import { loadBlockedUsersFromStorage, type BlockedUser } from '@/lib/blocked-users-storage';
import { useFocusEffect } from 'expo-router';
import {
  SPACING,
  buttonHeight,
  iconSm,
  inputMinHeight,
  radiusMd,
  screenPaddingX,
  space,
} from '@/theme/iosDesign';

export default function MessengerInboxScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [search, setSearch] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [openingPeerId, setOpeningPeerId] = useState<string | null>(null);

  const isProfilePublic = profile?.isPublic !== false;
  const userId = user?.id;

  const chatsQuery = useDirectChats(userId);
  const onlineQuery = useOnlineFriends(isProfilePublic ? userId : undefined);
  const getOrCreateChat = useGetOrCreateDirectChat();

  const loadBlocked = useCallback(async () => {
    setBlockedUsers(await loadBlockedUsersFromStorage());
  }, []);

  const refetchChats = chatsQuery.refetch;

  useFocusEffect(
    useCallback(() => {
      void loadBlocked();
      void refetchChats();
    }, [loadBlocked, refetchChats]),
  );

  const blockedIds = useMemo(() => new Set(blockedUsers.map((u) => u.id)), [blockedUsers]);

  const activeMembers: ActiveMember[] = useMemo(() => {
    return (onlineQuery.data ?? [])
      .filter((u) => !blockedIds.has(u.id))
      .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar }));
  }, [onlineQuery.data, blockedIds]);

  const conversations = useMemo(() => {
    const list = (chatsQuery.data ?? []).filter((c) => !blockedIds.has(c.peerId));
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.peerName.toLowerCase().includes(q));
  }, [chatsQuery.data, blockedIds, search]);

  const openChat = useCallback(
    (chatId: string, peerId: string, peerName: string, peerAvatar: string) => {
      router.push({
        pathname: '/(tabs)/social/chat/[chatId]',
        params: {
          chatId,
          peerId,
          peerName,
          peerAvatar,
        },
      } as unknown as Href);
    },
    [router],
  );

  const handleOpenConversation = useCallback(
    (conversation: DirectChatSummary) => {
      openChat(conversation.id, conversation.peerId, conversation.peerName, conversation.peerAvatar);
    },
    [openChat],
  );

  const handleOpenActiveMember = useCallback(
    async (member: ActiveMember) => {
      if (!userId || openingPeerId) return;
      setOpeningPeerId(member.id);
      try {
        const result = await getOrCreateChat.mutateAsync({
          currentUserId: userId,
          otherUserId: member.id,
        });
        openChat(result.id, member.id, member.name, member.avatar);
      } finally {
        setOpeningPeerId(null);
      }
    },
    [userId, openingPeerId, getOrCreateChat, openChat],
  );

  const renderItem = useCallback(
    ({ item }: { item: DirectChatSummary }) => (
      <ConversationListItem conversation={item} onPress={() => handleOpenConversation(item)} />
    ),
    [handleOpenConversation],
  );

  const findStudentsAction = (
    <TouchableOpacity
      style={[styles.findStudentsBtn, { borderColor: colors.glassBorder }]}
      onPress={() => router.push('/(tabs)/social/find-partners' as Href)}
      accessibilityRole="button"
      accessibilityLabel={t('messenger.findStudents')}
    >
      <UserPlus color={colors.primary} size={iconSm} />
      <Text variant="labelLarge" style={{ color: colors.primary }}>
        {t('messenger.findStudents')}
      </Text>
    </TouchableOpacity>
  );

  const listEmpty = () => {
    if (chatsQuery.isLoading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Text variant="titleMedium" style={{ color: colors.text, textAlign: 'center' }}>
          {t('messenger.noChats')}
        </Text>
        <Text variant="bodyMedium" style={{ color: colors.textMuted, textAlign: 'center', marginTop: space.space2 }}>
          {t('messenger.noChatsHint')}
        </Text>
      </View>
    );
  };

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader
        layout="tab"
        large
        title={t('messenger.title')}
        rightAction={findStudentsAction}
      />

      <OfflineFeatureNotice />

      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.cardBgLight, borderColor: colors.glassBorder },
        ]}
      >
        <Search color={colors.textMuted} size={iconSm} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder={t('messenger.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <ActiveMembersRow
        title={t('messenger.activeNow')}
        members={activeMembers}
        isLoading={onlineQuery.isLoading}
        onPressMember={handleOpenActiveMember}
        emptyMessage={t('messenger.noOneActive')}
        findPartnersLabel={t('messenger.findPartners')}
        onFindPartners={() => router.push('/(tabs)/social/find-partners' as Href)}
      />

      {openingPeerId ? (
        <View style={styles.openingOverlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl
            refreshing={chatsQuery.isRefetching}
            onRefresh={() => {
              void chatsQuery.refetch();
              void onlineQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={conversations.length === 0 ? styles.listEmptyGrow : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  findStudentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space2,
    paddingHorizontal: space.space3,
    paddingVertical: space.space2,
    borderRadius: radiusMd + 8,
    borderWidth: 1,
    minHeight: buttonHeight,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: screenPaddingX,
    marginBottom: SPACING.x2,
    paddingHorizontal: space.space4,
    borderRadius: radiusMd,
    borderWidth: 1,
    gap: space.space2,
    minHeight: inputMinHeight,
  },
  searchInput: {
    flex: 1,
    paddingVertical: space.space2,
    fontSize: 17,
    lineHeight: 22,
  },
  empty: {
    padding: SPACING.x4,
    alignItems: 'center',
  },
  listEmptyGrow: {
    flexGrow: 1,
  },
  openingOverlay: {
    paddingVertical: SPACING.x1,
    alignItems: 'center',
  },
});
