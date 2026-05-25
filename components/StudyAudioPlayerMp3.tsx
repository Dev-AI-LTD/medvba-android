import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import { Pause, Play, Square } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { iconMd, space, touchTargetMin, typeScale } from '@/theme/iosDesign';
import { getCachedStudyAudioUri } from '@/lib/study-audio-cache';
import { log } from '@/lib/log';

const styles = StyleSheet.create({
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
});

export type StudyAudioPlayerMp3Props = {
  remoteUrl: string;
  cacheKey: string;
  disabled?: boolean;
  onFailed: () => void;
  onStopParent: () => void;
};

export function StudyAudioPlayerMp3({
  remoteUrl,
  cacheKey,
  disabled,
  onFailed,
  onStopParent,
}: StudyAudioPlayerMp3Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const localUriRef = useRef<string | null>(null);
  const playGenerationRef = useRef(0);
  const wantPlayRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingUi, setIsPlayingUi] = useState(false);

  const hardStop = useCallback(() => {
    playGenerationRef.current += 1;
    wantPlayRef.current = false;
    setIsLoading(false);
    setIsPlayingUi(false);

    try {
      player.pause();
    } catch {
      /* ignore */
    }

    void player.seekTo(0).catch(() => {});
  }, [player]);

  useEffect(() => {
    setIsPlayingUi(status.playing);
  }, [status.playing]);

  useEffect(() => () => hardStop(), [hardStop]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        hardStop();
        onStopParent();
      };
    }, [hardStop, onStopParent]),
  );

  useEffect(() => {
    if (status.playing) {
      setIsPlayingUi(true);
      setIsLoading(false);
      return;
    }

    if (status.didJustFinish) {
      hardStop();
      return;
    }

    if (!wantPlayRef.current || !status.isLoaded) return;

    const gen = playGenerationRef.current;
    try {
      player.play();
      wantPlayRef.current = false;
      setIsPlayingUi(true);
      setIsLoading(false);
    } catch (e) {
      log.warn('[StudyAudio] auto play failed:', e);
      wantPlayRef.current = false;
      if (gen === playGenerationRef.current) {
        setIsLoading(false);
        onFailed();
      }
    }
  }, [status.isLoaded, status.playing, status.didJustFinish, player, hardStop, onFailed]);

  const startPlay = useCallback(async () => {
    if (disabled) return;

    const gen = playGenerationRef.current + 1;
    playGenerationRef.current = gen;
    wantPlayRef.current = true;
    setIsLoading(true);
    setIsPlayingUi(false);

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
        allowsRecording: false,
        shouldPlayInBackground: false,
      });

      if (playGenerationRef.current !== gen) return;

      if (!localUriRef.current) {
        localUriRef.current = await getCachedStudyAudioUri(remoteUrl, cacheKey);
      }

      if (playGenerationRef.current !== gen) return;

      player.replace({ uri: localUriRef.current });

      if (status.isLoaded) {
        player.play();
        setIsPlayingUi(true);
        setIsLoading(false);
      }
    } catch (e) {
      log.warn('[StudyAudio] MP3 prepare failed:', e);
      if (playGenerationRef.current === gen) {
        setIsLoading(false);
        setIsPlayingUi(false);
        onFailed();
      }
    }
  }, [disabled, remoteUrl, cacheKey, player, status.isLoaded, onFailed]);

  const handleStop = () => {
    hardStop();
    onStopParent();
  };

  const togglePause = () => {
    if (isPlayingUi || status.playing) {
      hardStop();
      return;
    }
    void startPlay();
  };

  const showPause = isPlayingUi || status.playing;
  const showLoading = isLoading && !showPause;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={togglePause}
        disabled={disabled || showLoading}
        activeOpacity={0.75}
        style={[styles.roundBtn, { backgroundColor: colors.primary }]}
        accessibilityLabel={showPause ? t('study.pauseAudio') : t('study.playAudio')}
      >
        {showLoading ? (
          <ActivityIndicator color={colors.text} size="small" />
        ) : showPause ? (
          <Pause color={colors.text} size={iconMd} />
        ) : (
          <Play color={colors.text} size={iconMd} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleStop}
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
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {showLoading ? t('study.audioBuffering') : t('study.audioStreaming')}
        </Text>
      </View>
    </View>
  );
}
