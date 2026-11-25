// Every path in the app. Never write a path as a string elsewhere.
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  verifyEmail: '/verify-email',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  users: {
    list: '/users',
    create: '/users/new',
    details: (id: string) => `/users/${encodeURIComponent(id)}`,
  },
  profile: '/profile',
  notifications: '/notifications',
  settings: '/settings',
} as const;
