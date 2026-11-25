// The main language: its keys are the list of all texts. `{name}` is replaced.
export const en = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    language: 'Language',
  },
  users: {
    title: 'Users',
    welcome: 'Welcome, {name}',
    count: { one: '{count} user', other: '{count} users' },
  },
};

// Every language has the same keys; plural forms may differ.
type Same<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends { other: string }
      ? { zero?: string; one?: string; two?: string; few?: string; many?: string; other: string }
      : Same<T[K]>;
};
export type Messages = Same<typeof en>;
