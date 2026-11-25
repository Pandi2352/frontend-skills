import { api } from '@/services/api';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

const open = { skipAuth: true } as const;

// The only file to change for other endpoints.
export const accountService = {
  /** Some servers sign in at once, others first check the email address. */
  register: (input: RegisterInput) => api.post<{ verificationRequired: boolean }>('/auth/register', input, open),
  verifyEmail: (email: string, code: string) => api.post<void>('/auth/verify-email', { email, code }, open),
  resendCode: (email: string) => api.post<void>('/auth/resend-code', { email }, open),
  forgotPassword: (email: string) => api.post<void>('/auth/forgot-password', { email }, open),
  resetPassword: (token: string, password: string) => api.post<void>('/auth/reset-password', { token, password }, open),
  changePassword: (current: string, password: string) => api.post<void>('/auth/change-password', { current, password }),
};
