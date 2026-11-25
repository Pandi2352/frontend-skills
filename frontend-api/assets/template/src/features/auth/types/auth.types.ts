import type { Permission } from '@/config/permissions';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  /** Sent by the server when it decides permissions itself. */
  permissions?: Permission[];
}

export interface Credentials {
  email: string;
  password: string;
}
