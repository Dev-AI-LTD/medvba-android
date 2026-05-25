import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Modal, TextInput } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { inputMinHeight, radiusLg, radiusMd, screenPaddingX, space, touchTargetMin, typeScale } from '@/theme/iosDesign';
import Button from '../Button';
import AvatarImage from '../AvatarImage';
import OnlineIndicator from '../OnlineIndicator';
import { AllChannelView } from './AllChannelView';
import { OnlineListView } from './OnlineListView';
import { PrivateChatsView } from './PrivateChatsView';
import { useTheme } from '@/providers/ThemeProvider';

type TabKey = 'all' | 'online' | 'private';

interface SocialScreenProps {
  userAvatar?: string;
  userId?: string;
  isOnline?: boolean;
}

export function SocialScreen({
  userAvatar,
  userId,
  isOnline = true,
}: SocialScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { colors } = useTheme();

  const getTabVariant = (tab: TabKey) => {
    return activeTab === tab ? 'primary' : 'secondary';
  };

  const handleSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <AvatarImage size={36} uri={userAvatar} />
            <OnlineIndicator isOnline={isOnline} size={10} />
          </View>
        </View>
        <Text variant="titleLarge" style={[styles.headerTitle, { color: colors.text }]}>
          Social
        </Text>
        <View style={styles.headerRight}>
          <IconButton
            icon="magnify"
            onPress={handleSearch}
            iconColor={colors.text}
          />
          <IconButton
            icon="cog-outline"
            onPress={handleSettings}
            iconColor={colors.text}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Button
          title="All"
          variant={getTabVariant('all')}
          onPress={() => setActiveTab('all')}
          style={styles.tabButton}
          fullWidth
        />
        <Button
          title="Online"
          variant={getTabVariant('online')}
          onPress={() => setActiveTab('online')}
          style={styles.tabButton}
          fullWidth
        />
        <Button
          title="Private"
          variant={getTabVariant('private')}
          onPress={() => setActiveTab('private')}
          style={styles.tabButton}
          fullWidth
        />
      </View>

      {/* Content */}
      <View style={[styles.contentCard, { backgroundColor: colors.cardBg }]}>
        {activeTab === 'all' && <AllChannelView />}
        {activeTab === 'online' && <OnlineListView />}
        {activeTab === 'private' && <PrivateChatsView />}
      </View>

      {/* Search Modal */}
      <Modal
        visible={isSearchOpen}
        animationType="fade"
        transparent
        onRequestClose={handleCloseSearch}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ color: colors.text }}>
                Search
              </Text>
              <IconButton
                icon="close"
                onPress={handleCloseSearch}
                iconColor={colors.text}
                accessibilityLabel="Close search"
              />
            </View>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.backgroundLight,
                  color: colors.text,
                  borderColor: colors.glassBorder,
                },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search users or conversations..."
              placeholderTextColor={colors.textMuted}
              autoFocus
              accessibilityLabel="Search input"
            />
            <View style={styles.searchHint}>
              <Text variant="bodyMedium" style={{ color: colors.textMuted }}>
                Search by name or username
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    marginBottom: space.space4,
    paddingHorizontal: space.space2,
    minHeight: touchTargetMin,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.space4,
    gap: space.space2,
  },
  tabButton: {
    flex: 1,
    minHeight: touchTargetMin,
  },
  contentCard: {
    flex: 1,
    borderRadius: radiusLg + 8,
    padding: screenPaddingX,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.space5,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radiusLg + 4,
    padding: screenPaddingX,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.space3,
  },
  searchInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radiusMd,
    paddingHorizontal: space.space4,
    paddingVertical: space.space3,
    ...typeScale.body,
    minHeight: inputMinHeight,
  },
  searchHint: {
    marginTop: space.space3,
    alignItems: 'center',
  },
});

export default SocialScreen;
