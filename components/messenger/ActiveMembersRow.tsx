import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import AvatarImage from '@/components/AvatarImage';
import OnlineIndicator from '@/components/OnlineIndicator';
import { useTheme } from '@/providers/ThemeProvider';
import {
  SPACING,
  buttonHeight,
  radiusMd,
  screenPaddingX,
  space,
  touchTargetMin,
} from '@/theme/iosDesign';

export type ActiveMember = {
  id: string;
  name: string;
  avatar: string;
};

type Props = {
  title: string;
  members: ActiveMember[];
  isLoading?: boolean;
  onPressMember: (member: ActiveMember) => void;
  emptyMessage: string;
  findPartnersLabel: string;
  onFindPartners: () => void;
};

export function ActiveMembersRow({
  title,
  members,
  isLoading,
  onPressMember,
  emptyMessage,
  findPartnersLabel,
  onFindPartners,
}: Props) {
  const { colors } = useTheme();
  const isEmpty = !isLoading && members.length === 0;

  return (
    <View style={styles.wrap}>
      <Text variant="labelLarge" style={[styles.title, { color: colors.textMuted }]}>
        {title}
      </Text>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : isEmpty ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.cardBgLight, borderColor: colors.glassBorder }]}>
          <Text variant="bodyMedium" style={{ color: colors.textMuted, textAlign: 'center' }}>
            {emptyMessage}
          </Text>
          <TouchableOpacity
            onPress={onFindPartners}
            style={[styles.findBtn, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={findPartnersLabel}
          >
            <Text variant="labelLarge" style={{ color: colors.inverse, fontWeight: '600' }}>
              {findPartnersLabel}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {members.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.item}
              onPress={() => onPressMember(member)}
              accessibilityRole="button"
              accessibilityLabel={member.name}
            >
              <View style={styles.avatarWrap}>
                <AvatarImage size={56} uri={member.avatar} seed={member.id} />
                <OnlineIndicator isOnline size={12} style={styles.dot} />
              </View>
              <Text
                variant="labelSmall"
                numberOfLines={1}
                style={[styles.name, { color: colors.text }]}
              >
                {member.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: SPACING.x2,
  },
  title: {
    paddingHorizontal: screenPaddingX,
    marginBottom: space.space2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  loader: {
    paddingVertical: SPACING.x3,
  },
  emptyBox: {
    marginHorizontal: screenPaddingX,
    padding: SPACING.x2,
    borderRadius: radiusMd,
    borderWidth: 1,
    gap: SPACING.x2,
    alignItems: 'center',
  },
  findBtn: {
    paddingHorizontal: SPACING.x3,
    paddingVertical: SPACING.x1 + 2,
    borderRadius: 20,
    minHeight: buttonHeight,
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: screenPaddingX,
    gap: SPACING.x2,
  },
  item: {
    alignItems: 'center',
    width: 72,
    minHeight: touchTargetMin + space.space6,
  },
  avatarWrap: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  name: {
    marginTop: 6,
    maxWidth: 72,
    textAlign: 'center',
  },
});
