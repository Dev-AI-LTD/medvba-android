import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Pause, Play, Square } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { hitSlop, iconMd, space, touchTargetMin, typeScale } from '@/theme/iosDesign';
import GlassCard from '@/components/GlassCard';
import { hasStudyStreamAudioNative } from '@/lib/study-audio-native';
import {
  prepareAudioModeForPlayback,
  startStudySpeech,
  stopStudySpeech,
  type StudySpeechSession,
} from '@/lib/study-speech';
import { log } from '@/lib/log';
import type { StudyAudioPlayerMp3Props } from '@/components/StudyAudioPlayerMp3';

type Props = {
  audioUrl: string | null | undefined;
  fallbackText: string;
  locale: 'ro' | 'en';
  moduleId: string;
  chapterId: string;
  disabled?: boolean;
};

type PlaybackMode = 'mp3' | 'tts' | null;

type Mp3Component = React.ComponentType<StudyAudioPlayerMp3Props>;

export function StudyAudioPlayer({
  audioUrl,
  fallbackText,
  locale,
  moduleId,
  chapterId,
  disabled,
}: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const remoteUrl = audioUrl?.trim() || null;
  const cacheKey = `${moduleId}-${chapterId}-${locale}`;
  const nativeMp3 = hasStudyStreamAudioNative();
  const [mode, setMode] = useState<PlaybackMode>(nativeMp3 && remoteUrl ? 'mp3' : null);
  const [Mp3Player, setMp3Player] = useState<Mp3Component | null>(null);
  const speechRef = useRef<StudySpeechSession | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [playError, setPlayError] = useState(false);

  useEffect(() => {
    if (!nativeMp3) return;
    let cancelled = false;
    void import('@/components/StudyAudioPlayerMp3')
      .then((mod) => {
        if (!cancelled) setMp3Player(() => mod.StudyAudioPlayerMp3);
      })
      .catch((e) => log.warn('[StudyAudio] MP3 module load failed:', e));
    return () => {
      cancelled = true;
    };
  }, [nativeMp3]);

  const stopTts = useCallback(() => {
    speechRef.current?.stop();
    speechRef.current = null;
    void stopStudySpeech();
    setTtsPlaying(false);
    setTtsLoading(false);
    setPlayError(false);
  }, []);

  const stopAll = useCallback(() => {
    stopTts();
    setPlayError(false);
  }, [stopTts]);

  useFocusEffect(
    useCallback(() => {
      return () => stopAll();
    }, [stopAll]),
  );

  useEffect(() => {
    setMode(nativeMp3 && remoteUrl ? 'mp3' : null);
    stopAll();
  }, [remoteUrl, cacheKey, nativeMp3, stopAll]);

  const startTts = useCallback(() => {
    setMode('tts');
    setPlayError(false);
    if (!fallbackText.trim()) {
      setPlayError(true);
      return;
    }
    stopTts();
    setTtsLoading(true);
    void prepareAudioModeForPlayback();
    speechRef.current = startStudySpeech(fallbackText, locale, (playing) => {
      setTtsPlaying(playing);
      setTtsLoading(false);
      if (!playing) speechRef.current = null;
    });
  }, [fallbackText, locale, stopTts]);

  const handleMp3Failed = useCallback(() => {
    startTts();
  }, [startTts]);

  if (mode === 'mp3' && remoteUrl && Mp3Player) {
    return (
      <GlassCard style={styles.card}>
        <Mp3Player
          remoteUrl={remoteUrl}
          cacheKey={cacheKey}
          disabled={disabled}
          onFailed={handleMp3Failed}
          onStopParent={stopAll}
        />
      </GlassCard>
    );
  }

  const toggleTts = () => {
    if (disabled) return;
    if (ttsPlaying) {
      stopTts();
      return;
    }
    startTts();
  };

  const hint = playError
    ? 'study.audioError'
    : remoteUrl && !nativeMp3
      ? 'study.audioTtsUntilRebuild'
      : mode === 'tts' && remoteUrl
        ? 'study.audioStreamRetryHint'
        : 'study.audioTtsFallback';

  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={toggleTts}
          disabled={disabled || ttsLoading}
          activeOpacity={0.75}
          style={[styles.roundBtn, { backgroundColor: colors.primary }]}
        >
          {ttsLoading ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : ttsPlaying ? (
            <Pause color={colors.text} size={iconMd} />
          ) : (
            <Play color={colors.text} size={iconMd} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={stopTts}
          disabled={disabled}
          activeOpacity={0.75}
          style={[
            styles.roundBtn,
            styles.stopBtn,
            {
              backgroundColor: colors.backgroundLight,
              borderColor: colors.glassBorder,
              opacity: disabled ? 0.45 : 1,
            },
          ]}
          accessibilityLabel={t('study.stopAudio')}
        >
          <Square color={colors.text} size={iconMd - 4} fill={colors.text} />
        </TouchableOpacity>

        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>{t('study.listenSummary')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t(hint)}</Text>
          {remoteUrl && nativeMp3 && Mp3Player && mode === 'tts' && (
            <TouchableOpacity
              onPress={() => {
                stopTts();
                setMode('mp3');
              }}
              hitSlop={hitSlop.default}
            >
              <Text style={[styles.retryLink, { color: colors.primary }]}>
                {t('study.audioRetryMp3')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.space4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space3,
  },
  roundBtn: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: { borderWidth: 1 },
  copy: { flex: 1 },
  title: { ...typeScale.body, fontWeight: '600' },
  hint: { ...typeScale.caption, marginTop: space.space1 },
  retryLink: { ...typeScale.caption, marginTop: space.space2 - 2, fontWeight: '600' },
});
