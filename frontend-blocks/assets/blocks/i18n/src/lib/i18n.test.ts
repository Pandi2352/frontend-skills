import { afterEach, describe, expect, it, vi } from 'vitest';
import { appConfig } from '@/config/app.config';
import { uiText } from '@/constants/ui-text';
import { changeLanguage, detectLanguage, getLanguage, startI18n, t } from './i18n';

const english = { ...uiText };
afterEach(async () => {
  localStorage.clear();
  vi.restoreAllMocks();
  Object.assign(uiText, english);
  document.documentElement.dir = '';
});

describe('i18n', () => {
  it('replaces values and chooses the plural form', async () => {
    await startI18n('en');
    expect(t('users.welcome', { name: 'Asha' })).toBe('Welcome, Asha');
    expect(t('users.count', { count: 1 })).toBe('1 user');
    expect(t('users.count', { count: 1200 })).toBe('1,200 users');
    expect(t('users.welcome')).toBe('Welcome, {name}');
  });

  it('loads another language with its direction, plurals and shared words', async () => {
    await startI18n('ar');
    expect(getLanguage()).toBe('ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(appConfig.locale).toBe('ar-EG');
    expect(t('users.count', { count: 2 })).toBe('مستخدمان');
    expect(uiText.close).toBe('إغلاق');
    expect(uiText.noResultsTitle).toBe('No results');
  });

  it('uses the saved language, then the browser, then English', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR', 'ar-SA']);
    expect(detectLanguage()).toBe('ar');
    const reload = vi.fn();
    changeLanguage('en', reload);
    expect(reload).toHaveBeenCalled();
    expect(detectLanguage()).toBe('en');
    localStorage.setItem('language', 'toString');
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
    expect(detectLanguage()).toBe('en');
  });
});
