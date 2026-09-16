import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { connectDrive, disconnectDrive, getStoredAccessToken } from '@/lib/google/auth';

import { DriveContext, type DriveConnection } from './driveContext';

export function DriveProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(() => getStoredAccessToken() !== null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    setIsConnecting(true);
    setError(null);
    connectDrive()
      .then(() => {
        setIsConnected(true);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Could not connect to Google Drive.');
      })
      .finally(() => {
        setIsConnecting(false);
      });
  }, []);

  const disconnect = useCallback(() => {
    disconnectDrive();
    setIsConnected(false);
  }, []);

  const connection = useMemo<DriveConnection>(
    () => ({ isConnected, isConnecting, error, connect, disconnect }),
    [isConnected, isConnecting, error, connect, disconnect],
  );

  return <DriveContext value={connection}>{children}</DriveContext>;
}
