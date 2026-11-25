// Replace with the real permissions and roles.
export const PERMISSIONS = ['users.read', 'users.write', 'users.delete', 'settings.manage'] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  admin: PERMISSIONS,
  editor: ['users.read', 'users.write'],
  viewer: ['users.read'],
};
