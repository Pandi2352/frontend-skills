// The same rules on every page that asks for an email or a new password. The server decides.
export const authText = {
  email: 'Email',
  password: 'Password',
  newPassword: 'New password',
  currentPassword: 'Current password',
  repeatPassword: 'Repeat password',
  enterEmail: 'Enter your email',
  wrongEmail: 'Enter a valid email address',
  enterPassword: 'Enter your password',
  shortPassword: 'Use at least 8 characters',
  samePassword: 'The passwords are different',
  wrongLogin: 'Email or password is incorrect.',
};

export const emailRules = {
  required: authText.enterEmail,
  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: authText.wrongEmail },
};
export const newPasswordRules = {
  required: authText.enterPassword,
  minLength: { value: 8, message: authText.shortPassword },
};
export const repeatRules = {
  required: authText.enterPassword,
  validate: (value: string, values: { password: string }) => value === values.password || authText.samePassword,
  deps: ['password' as const],
};
