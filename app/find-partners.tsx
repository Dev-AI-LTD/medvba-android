import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Search, MapPin, School, Users, Filter, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import GlassCard from '@/components/GlassCard';
import AvatarImage from '@/components/AvatarImage';
import { useStudyPartners, useGetOrCreateDirectChat } from '@/lib/supabase-hooks';
import type { UserAccount } from '@/types/user';
import { useAuth } from '@/providers/AuthProvider';

export default function FindPartnersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const [selectedUniversity, setSelectedUniversity] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const { data: allPartners = [], isLoading, refetch, isRefetching } = useStudyPartners();
  const createOrGetChatMutation = useGetOrCreateDirectChat();

  const filteredPartners = useMemo(() => {
    let filtered = allPartners.filter((partner) => partner.id !== user?.id);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (partner) =>
          partner.name.toLowerCase().includes(query) ||
          partner.bio?.toLowerCase().includes(query) ||
          partner.city?.toLowerCase().includes(query) ||
          partner.university?.toLowerCase().includes(query)
      );
    }

    if (selectedCity) {
      filtered = filtered.filter((partner) => partner.city === selectedCity);
    }

    if (selectedUniversity) {
      filtered = filtered.filter((partner) => partner.university === selectedUniversity);
    }

    return filtered;
  }, [allPartners, searchQuery, selectedCity, selectedUniversity, user?.id]);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    allPartners.forEach((partner) => {
      if (partner.city) cities.add(partner.city);
    });
    return Array.from(cities).sort();
  }, [allPartners]);

  const availableUniversities = useMemo(() => {
    const universities = new Set<string>();
    allPartners.forEach((partner) => {
      if (partner.university) universities.add(partner.university);
    });
    return Array.from(universities).sort();
  }, [allPartners]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCity) count++;
    if (selectedUniversity) count++;
    return count;
  }, [selectedCity, selectedUniversity]);

  const handleClearFilters = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCity(undefined);
    setSelectedUniversity(undefined);
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderPartnerCard = (partner: UserAccount) => (
    <GlassCard key={partner.id} style={styles.partnerCard}>
      <View style={styles.partnerHeader}>
        <AvatarImage uri={partner.avatar} size={56} seed={partner.id} style={styles.partnerAvatarStyle} />
        <View style={styles.partnerInfo}>
          <Text style={styles.partnerName}>{partner.name}</Text>
          {partner.city && (
            <View style={styles.partnerMetaItem}>
              <MapPin color={colors.accent} size={14} />
              <Text style={styles.partnerMetaText}>{partner.city}</Text>
            </View>
          )}
        </View>
      </View>

      {partner.university && (
        <View style={styles.partnerDetail}>
          <View style={styles.partnerDetailIcon}>
            <School color={colors.secondary} size={16} />
          </View>
          <Text style={styles.partnerDetailText}>
            {partner.university}
            {partner.year_of_study && ` • ${t('partners.yearOfStudy').replace('{year}', String(partner.year_of_study))}`}
          </Text>
        </View>
      )}

      {partner.bio && (
        <View style={styles.partnerBio}>
          <Text style={styles.partnerBioText} numberOfLines={3}>
            {partner.bio}
          </Text>
        </View>
      )}

      <View style={styles.partnerActions}>
        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push(`/profile/${partner.id}`);
          }}
          activeOpacity={0.7}
        >
          <Users color={colors.primary} size={16} />
          <Text style={styles.viewProfileButtonText}>{t('partners.viewProfile')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.connectButton}
          onPress={async () => {
            if (!user?.id) return;
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            try {
              const result = await createOrGetChatMutation.mutateAsync({
                currentUserId: user.id,
                otherUserId: partner.id,
              });
              router.push(`/direct-chat?chatId=${result.id}`);
            } catch (error) {
              console.error('Error starting chat:', error);
            }
          }}
          disabled={createOrGetChatMutation.isPending}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          {createOrGetChatMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <MessageCircle color={colors.text} size={16} />
              <Text style={styles.connectButtonText}>{t('partners.message')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.7}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('partners.title')}</Text>
          <TouchableOpacity
            style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setShowFilters(!showFilters);
            }}
            activeOpacity={0.7}
          >
            <Filter color={activeFiltersCount > 0 ? colors.text : colors.textSecondary} size={22} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search color={colors.textMuted} size={20} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('partners.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color={colors.textMuted} size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showFilters && (
          <View style={styles.filtersSection}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.filtersSectionTitle}>{t('partners.filters')}</Text>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{t('partners.filterCity')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedCity && styles.filterChipActive]}
                  onPress={() => setSelectedCity(undefined)}
                >
                  <Text style={[styles.filterChipText, !selectedCity && styles.filterChipTextActive]}>{t('partners.filterAll')}</Text>
                </TouchableOpacity>
                {availableCities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[styles.filterChip, selectedCity === city && styles.filterChipActive]}
                    onPress={() => setSelectedCity(city)}
                  >
                    <Text style={[styles.filterChipText, selectedCity === city && styles.filterChipTextActive]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{t('partners.filterUniversity')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedUniversity && styles.filterChipActive]}
                  onPress={() => setSelectedUniversity(undefined)}
                >
                  <Text style={[styles.filterChipText, !selectedUniversity && styles.filterChipTextActive]}>{t('partners.filterAll')}</Text>
                </TouchableOpacity>
                {availableUniversities.map((uni) => (
                  <TouchableOpacity
                    key={uni}
                    style={[styles.filterChip, selectedUniversity === uni && styles.filterChipActive]}
                    onPress={() => setSelectedUniversity(uni)}
                  >
                    <Text style={[styles.filterChipText, selectedUniversity === uni && styles.filterChipTextActive]}>
                      {uni}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {activeFiltersCount > 0 && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={handleClearFilters}>
                <Text style={styles.clearFiltersButtonText}>{t('partners.clearFilters')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        >
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {isLoading ? t('partners.loading') : t('partners.studentsFound').replace('{count}', String(filteredPartners.length))}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('partners.loading')}</Text>
            </View>
          ) : filteredPartners.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users color={colors.textMuted} size={64} />
              <Text style={styles.emptyTitle}>{t('partners.noFound')}</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || activeFiltersCount > 0
                  ? t('partners.adjustSearch')
                  : t('partners.beFirst')}
              </Text>
            </View>
          ) : (
            filteredPartners.map(renderPartnerCard)
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.text,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  filtersSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    overflow: 'hidden',
  },
  filtersSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  filterChips: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBgLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.text,
  },
  clearFiltersButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  clearFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  partnerCard: {
    marginBottom: 16,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  partnerAvatarStyle: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  partnerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partnerMetaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  partnerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  partnerDetailIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerDetailText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  partnerBio: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  partnerBioText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  viewProfileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.cardBgLight,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  viewProfileButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    overflow: 'hidden',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
});
