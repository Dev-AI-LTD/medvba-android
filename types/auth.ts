export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface AuthError {
  message: string;
  code?: string;
}
