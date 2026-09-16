import { createContext, use } from 'react';

export interface DriveConnection {
  isConnected: boolean;
  isConnecting: boolean;
  /** Message from the last failed connection attempt, if any. */
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

export const DriveContext = createContext<DriveConnection | null>(null);

export function useDrive(): DriveConnection {
  const connection = use(DriveContext);
  if (!connection) {
    throw new Error('useDrive must be used inside <DriveProvider>.');
  }
  return connection;
}
