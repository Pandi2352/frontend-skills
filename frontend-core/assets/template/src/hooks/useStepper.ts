import { useState } from 'react';

/** State for Stepper. `next` first runs your check and stays when it returns false. */
export function useStepper(count: number) {
  const [current, setCurrent] = useState(0);
  const [reached, setReached] = useState(0);
  const goTo = (index: number) => {
    const target = Math.min(Math.max(index, 0), count - 1);
    setCurrent(target);
    setReached((r) => Math.max(r, target));
  };
  return {
    current,
    reached,
    isFirst: current === 0,
    isLast: current === count - 1,
    goTo,
    back: () => goTo(current - 1),
    /** `next(() => form.trigger(['name', 'email']))` */
    next: async (check?: () => boolean | Promise<boolean>) => {
      if (check && !(await check())) return false;
      goTo(current + 1);
      return true;
    },
    reset: () => {
      setCurrent(0);
      setReached(0);
    },
  };
}
