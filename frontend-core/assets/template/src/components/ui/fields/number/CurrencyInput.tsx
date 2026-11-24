import { appConfig } from '@/config/app.config';
import { NumberInput, type NumberInputProps } from './NumberInput';

export interface CurrencyInputProps extends Omit<NumberInputProps, 'prefix' | 'precision'> {
  currency?: string;
}

/** Symbol and decimal places come from the currency (USD 2, JPY 0). */
export function CurrencyInput(props: CurrencyInputProps) {
  const { currency = appConfig.currency, locale = appConfig.locale, ...rest } = props;
  const format = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const symbol = format.formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;
  return (
    <NumberInput
      hideStepper
      align="end"
      min={0}
      {...rest}
      locale={locale}
      prefix={symbol}
      precision={format.resolvedOptions().maximumFractionDigits ?? 2}
    />
  );
}
