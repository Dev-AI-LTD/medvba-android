import { persistMedvbaKindeRefreshToken } from '@/lib/medvba-session-storage';
import { persistKindeRefreshTokenFromSdk } from '@/lib/kinde-refresh-persistence';

jest.mock('@/lib/medvba-session-storage', () => ({
  persistMedvbaKindeRefreshToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/expo-public-extra', () => ({
  getMergedExpoExtra: () => ({
    EXPO_PUBLIC_KINDE_ISSUER_URL: 'https://test.example.kinde.com',
    EXPO_PUBLIC_KINDE_CLIENT_ID: 'test-client-id',
  }),
}));

describe('persistKindeRefreshTokenFromSdk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists refresh token when SDK returns success', async () => {
    await persistKindeRefreshTokenFromSdk({
      refreshToken: jest.fn().mockResolvedValue({
        success: true,
        refreshToken: 'kinde-rt-abc',
      }),
    });
    expect(persistMedvbaKindeRefreshToken).toHaveBeenCalledWith('kinde-rt-abc');
  });

  it('skips when refreshToken is missing on SDK', async () => {
    await persistKindeRefreshTokenFromSdk({});
    expect(persistMedvbaKindeRefreshToken).not.toHaveBeenCalled();
  });

  it('skips when SDK reports failure', async () => {
    await persistKindeRefreshTokenFromSdk({
      refreshToken: jest.fn().mockResolvedValue({ success: false }),
    });
    expect(persistMedvbaKindeRefreshToken).not.toHaveBeenCalled();
  });
});
