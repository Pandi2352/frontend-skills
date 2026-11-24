import { NumberInput, type NumberInputProps } from './NumberInput';

/** 25 means 25%. */
export function PercentInput(props: Omit<NumberInputProps, 'suffix'>) {
  return <NumberInput min={0} max={100} precision={2} hideStepper align="end" {...props} suffix="%" />;
}
