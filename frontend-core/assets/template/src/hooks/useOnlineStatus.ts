import { useSyncExternalStore } from 'react';

const subscribe = (run: () => void) => {
  window.addEventListener('online', run);
  window.addEventListener('offline', run);
  return () => {
    window.removeEventListener('online', run);
    window.removeEventListener('offline', run);
  };
};

export const useOnlineStatus = () =>
  useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
