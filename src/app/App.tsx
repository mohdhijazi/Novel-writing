import { DriveProvider } from '@/features/drive/DriveProvider';
import { NovelsPage } from '@/features/novels/NovelsPage';

export function App() {
  return (
    <DriveProvider>
      <NovelsPage />
    </DriveProvider>
  );
}
