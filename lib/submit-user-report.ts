import { TRPCClientError } from '@trpc/client';

import { getTrpcVanillaClient } from '@/lib/trpc';
import {
  addUserReport,
  type UserReportReason,
} from '@/lib/user-reports-storage';
import { log } from '@/lib/log';

export type SubmitUserReportInput = {
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: UserReportReason;
  chatId?: string;
};

/**
 * Persists a user report on the server (Supabase via tRPC).
 * Falls back to local AsyncStorage if the API is unavailable (offline / migration not applied).
 */
export async function submitUserReport(input: SubmitUserReportInput): Promise<void> {
  try {
    await getTrpcVanillaClient().reports.submit.mutate({
      reportedUserId: input.reportedUserId,
      reportedUserName: input.reportedUserName,
      reason: input.reason,
      chatId: input.chatId,
    });
    return;
  } catch (error) {
    const isMissingTable =
      error instanceof TRPCClientError &&
      /user_reports|relation.*does not exist|Failed to submit report/i.test(
        error.message ?? '',
      );

    if (!isMissingTable) {
      log.warn('[Report] Server submit failed, saving locally:', error);
    }

    await addUserReport({
      reporterId: input.reporterId,
      reportedUserId: input.reportedUserId,
      reportedUserName: input.reportedUserName,
      reason: input.reason,
      chatId: input.chatId,
    });
  }
}
