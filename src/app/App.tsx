import { DriveProvider } from '@/features/drive/DriveProvider';
import { WorldsPage } from '@/features/worlds/WorldsPage';

export function App() {
  return (
    <DriveProvider>
      <WorldsPage />
    </DriveProvider>
  );
}
