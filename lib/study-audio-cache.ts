import * as FileSystem from 'expo-file-system/legacy';
import { log } from '@/lib/log';

/**
 * Download chapter MP3 to device cache (or return existing file).
 * Local playback is far more reliable than streaming on Android.
 */
export async function getCachedStudyAudioUri(
  remoteUrl: string,
  cacheKey: string,
): Promise<string> {
  const base = FileSystem.cacheDirectory;
  if (!base) {
    throw new Error('No cache directory');
  }

  const safeKey = cacheKey.replace(/[^a-zA-Z0-9._-]/g, '_');
  const dir = `${base}study-audio/`;
  const localPath = `${dir}${safeKey}.mp3`;

  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});

  const existing = await FileSystem.getInfoAsync(localPath);
  if (existing.exists && (existing.size ?? 0) > 1000) {
    return localPath;
  }

  log.debug('[StudyAudio] Downloading', remoteUrl);
  const result = await FileSystem.downloadAsync(remoteUrl, localPath);
  if (result.status !== 200) {
    throw new Error(`Download failed: HTTP ${result.status}`);
  }

  const downloaded = await FileSystem.getInfoAsync(localPath);
  if (!downloaded.exists || (downloaded.size ?? 0) < 1000) {
    throw new Error('Downloaded file is empty');
  }

  return result.uri;
}
