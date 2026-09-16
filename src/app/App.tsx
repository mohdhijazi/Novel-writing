import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { DriveProvider } from '@/features/drive/DriveProvider';
import { ChapterEditorPage } from '@/features/novels/ChapterEditorPage';
import { NovelPage } from '@/features/novels/NovelPage';
import { NovelsTab } from '@/features/novels/NovelsTab';
import { WorldPage } from '@/features/worlds/WorldPage';
import { WorldTabPanel } from '@/features/worlds/WorldTabPanel';
import { WorldsPage } from '@/features/worlds/WorldsPage';
import { DEFAULT_WORLD_TAB } from '@/features/worlds/worldTabs';

export function App() {
  return (
    <DriveProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<WorldsPage />} />
          <Route path="/worlds/:worldId" element={<WorldPage />}>
            <Route index element={<Navigate to={DEFAULT_WORLD_TAB} replace />} />
            <Route path="novels" element={<NovelsTab />} />
            <Route path="novels/:novelId" element={<NovelPage />} />
            <Route path="novels/:novelId/chapters/:chapterId" element={<ChapterEditorPage />} />
            <Route path=":tabSlug" element={<WorldTabPanel />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </DriveProvider>
  );
}
