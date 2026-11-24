// Every path in the app. Never write a path as a string elsewhere.
export const ROUTES = {
  home: '/',
  login: '/login',
  users: {
    list: '/users',
    create: '/users/new',
    details: (id: string) => `/users/${encodeURIComponent(id)}`,
  },
  settings: '/settings',
} as const;
