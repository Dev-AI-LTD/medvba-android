import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '@/components/layout';
import Colors from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';
import { typeScale } from '@/theme/iosDesign';

export default function ModalScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <Screen style={{ backgroundColor: Colors.background }} padded>
      <ScreenHeader
        layout="stack-centered"
        onBack={() => router.back()}
        title={t('modal.devTitle')}
        backVariant="pill"
      />
      <View style={styles.content}>
        <Text style={styles.hint}>{t('modal.devTitle')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    ...typeScale.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
