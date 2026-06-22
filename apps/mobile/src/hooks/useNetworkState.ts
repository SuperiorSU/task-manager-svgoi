import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

import { useAppStore } from '../stores/app.store';

export const useNetworkState = () => {
  const { isOnline, setOnlineStatus } = useAppStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnlineStatus(state.isConnected ?? true);
    });
    return unsubscribe;
  }, [setOnlineStatus]);

  return { isOnline };
};
