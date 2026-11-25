import type { fieldText } from '@/constants/field-text';
import type { uiText } from '@/constants/ui-text';
import type { Messages } from './en';

// Example of a right-to-left language. Have a native speaker check every text.
export const messages: Messages = {
  common: { save: 'حفظ', cancel: 'إلغاء', language: 'اللغة' },
  users: {
    title: 'المستخدمون',
    welcome: 'مرحبًا، {name}',
    count: {
      zero: 'لا يوجد مستخدمون',
      one: 'مستخدم واحد',
      two: 'مستخدمان',
      few: '{count} مستخدمين',
      many: '{count} مستخدمًا',
      other: '{count} مستخدم',
    },
  },
};

// The words inside shared components; missing ones stay English.
export const ui: Partial<typeof uiText> = {
  close: 'إغلاق',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  loading: 'جارٍ التحميل',
  retry: 'حاول مرة أخرى',
  search: 'بحث',
  back: 'رجوع',
  previous: 'الصفحة السابقة',
  next: 'الصفحة التالية',
  rowsPerPage: 'صفوف في الصفحة',
};

export const fields: Partial<typeof fieldText> = {
  required: 'مطلوب',
};
