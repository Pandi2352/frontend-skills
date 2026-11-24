interface AppConfig {
  /** Shown in browser tab titles. */
  name: string;
  locale: string;
  currency: string;
  country: string;
  /** 0 = Sunday, 1 = Monday */
  weekStartsOn: number;
}

// Project-wide defaults used by date, number, currency and phone fields.
export const appConfig: AppConfig = {
  name: 'My app',
  locale: 'en-US',
  currency: 'USD',
  country: 'US',
  weekStartsOn: 0,
};
