import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as MailComposer from 'expo-mail-composer';

const DEFAULT_SUPPORT_EMAIL = 'contact@devaieood.com';

export function getSupportEmail(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPPORT_EMAIL?.trim()) ||
    (Constants.expoConfig?.extra as { EXPO_PUBLIC_SUPPORT_EMAIL?: string } | undefined)
      ?.EXPO_PUBLIC_SUPPORT_EMAIL?.trim();
  return fromEnv || DEFAULT_SUPPORT_EMAIL;
}

export type OpenSupportMailResult =
  | 'sent'
  | 'saved'
  | 'cancelled'
  | 'opened_mailto'
  | 'unavailable';

/**
 * Opens the native mail composer when possible; otherwise opens a `mailto:` link (Android 11+ needs manifest queries).
 */
export async function openSupportMail(params: {
  subject: string;
  body: string;
  recipient?: string;
}): Promise<OpenSupportMailResult> {
  const email = params.recipient?.trim() || getSupportEmail();
  const subjectEnc = encodeURIComponent(params.subject);
  const bodyEnc = encodeURIComponent(params.body);
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${subjectEnc}&body=${bodyEnc}`;

  try {
    const available = await MailComposer.isAvailableAsync();
    if (available) {
      const result = await MailComposer.composeAsync({
        recipients: [email],
        subject: params.subject,
        body: params.body,
      });
      if (result.status === MailComposer.MailComposerStatus.SENT) return 'sent';
      if (result.status === MailComposer.MailComposerStatus.SAVED) return 'saved';
      if (result.status === MailComposer.MailComposerStatus.CANCELLED) return 'cancelled';
      return 'cancelled';
    }
  } catch {
    /* fall through */
  }

  try {
    if (Platform.OS === 'web') {
      window.open(mailto, '_blank', 'noopener,noreferrer');
      return 'opened_mailto';
    }
    await Linking.openURL(mailto);
    return 'opened_mailto';
  } catch {
    return 'unavailable';
  }
}
