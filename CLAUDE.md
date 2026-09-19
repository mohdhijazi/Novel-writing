# Worlds

A world-building app: characters, locations, events, a calendar/timeline, and the links between
them. A novel (or several) is one part of a world — books and their chapters come later. Used on a
Windows PC and an iPad.

The repo and URL keep the name "Novel-writing"; the app is called "Worlds".

## Architecture (decided — don't relitigate unless asked)

- **One PWA** (Vite + React + TypeScript), hosted on GitHub Pages at
  `https://mohdhijazi.github.io/Novel-writing/`. Installed via "Add to Home Screen" (iPad) or
  "Install app" (Chrome/Edge). No Electron/Tauri/native builds.
- **Local-first:** IndexedDB is the source of truth on each device; the app must work fully offline.
- **Sync:** directly to the Google Drive REST API (Google Identity Services, scope `drive.file`),
  JSON file(s) in Drive. No backend server.
- **Conflicts:** last-write-wins per record by `updatedAt`. Single user, two devices — keep it simple.
- Deletes must be soft (`deletedAt`), otherwise sync resurrects deleted records.

## Storage model (agreed — don't change without asking)

```
My Drive/
  Worlds/                     root folder, created by the app
    <World name>/             one folder per world
      world.json              { schemaVersion, id, name, createdAt, updatedAt, deletedAt }
      characters.json         one file per collection, all records of that kind
      locations.json
      connections.json        links between locations, drawn on the map
      calendar.json           one record: the world's calendar (id = world id)
      events.json
      ideas.json
      relations.json          one per relation board
      tickets.json            cards on those boards
      ticketLinks.json        labelled lines between cards
      Novels/
        <Novel title>/
          novel.json
          <NN Chapter title>/
            chapter.json
            paragraphs.json   { schemaVersion, chapterId, updatedAt, paragraphs: [...] }
```

- Collection file: `{ schemaVersion, collection, updatedAt, records: [...] }`.
- Every record: UUID `id` (made on the device), ISO-8601 UTC `updatedAt`, `deletedAt` for soft
  deletes. Tombstones are purged after 90 days.
- `drive.file` scope means the app only sees what it created — the app must create the root folder;
  a folder the user made by hand is invisible to it. Folders are tracked by Drive **ID**, not name,
  so the user can rename or move them.
- Worlds are discovered on other devices by listing subfolders of the root folder and reading each
  `world.json`.
- Syncing merges record by record (newest `updatedAt` wins) and uploads only what changed.
- Collections mirror the tabs of a world. Novels are folders rather than a collection file,
  because they hold chapter folders.
- Paragraphs are one JSON file per chapter, not one file each: a file per paragraph would mean
  renaming every later file whenever a paragraph is inserted mid-chapter.
- Upload decisions use a per-chapter revision counter (`paragraphsRevision` vs
  `paragraphsSyncedRevision`), never a timestamp comparison — a device whose clock runs ahead
  would otherwise silently suppress the other device's edits, including deletes.
- Downloads are skipped when Drive's `modifiedTime` matches the one stored at the last merge.
- Collection files are created when a world's folder is created. A world created by an older
  version keeps the files it had; there is no migration step yet.
- Drive keeps 30 days of file revisions — that is the recovery path for a bad overwrite.

## Commands

- `npm run dev` — dev server at http://localhost:5173/Novel-writing/ (service worker disabled)
- `npm run build` then `npm run preview` — test the production build incl. service worker/offline
- `npm run check` — type check + lint + format check. **Must pass before any change is done.**
- `npm run format` — auto-format

Pushing to `main` runs `.github/workflows/deploy.yml` (check → build → deploy to Pages).

## Code conventions

The user wants the code **super organized and very clean, always**.

- **Structure**
  - `src/app/` — app shell (layout, routing, providers)
  - `src/features/<feature>/` — everything for one feature (components, hooks, data access,
    styles). Features don't import from each other's internals; shared code moves to `lib/` or a
    shared component folder.
  - `src/lib/` — feature-agnostic helpers
  - `src/styles/global.css` — reset + design tokens
- **TypeScript:** strict; no `any`, no non-null `!` assertions, no `@ts-ignore`/`eslint-disable`
  to silence problems — fix the cause.
- **React:** function components, named exports, one component per file, file named after it
  (`CharacterList.tsx`).
- **Styling:** CSS Modules (`Component.module.css`) next to the component. Use the tokens in
  `global.css` — add a token rather than hard-coding a color, size, or spacing value.
- **Imports:** use the `@/` alias for anything outside the current feature folder. A feature may
  call another feature's repository (relations reads characters and locations) but never reaches
  into its components; board drag/link behaviour is shared through `lib/map/`.
- **Routing:** React Router with `HashRouter` (`#/worlds/<id>/<tab>`). Hash URLs avoid GitHub Pages
  404s on refreshed deep links and keep the back button/iPad back-swipe working.
- **Deleting:** every delete goes through `components/HoldToDelete` — a 2-second hold with a
  countdown on the button, 4 seconds for a whole world. There is no undo, so deletes must take
  deliberate intent.
- Deleting a world only tombstones the record: its Drive folder stays, and sync skips deleted
  worlds rather than touching their contents.
- **No dead code:** no placeholders, unused exports, commented-out code, or speculative
  abstractions. Add a library when a feature needs it (e.g. Dexie with the first stored data).
- Comments explain _why_, not _what_.

## Gotchas

- Vite `base` is `/Novel-writing/`; reference public assets as `/icons/...` in `index.html` and
  let Vite prefix them.
- Google OAuth "Authorized JavaScript origins" must include `http://localhost:5173` for local
  testing, plus `https://mohdhijazi.github.io`.
- Drive file search: build the `q` filter with `encodeURIComponent()` on the whole string. Hand-rolled
  encoding silently fails and makes each device create its own duplicate file.
- The original hello-sync prototype (IndexedDB + Drive sync, OAuth client ID) is in git history at
  commit `ab48747` — reuse its Drive calls when building sync.
- The user previously built "Story Planner" (React + Spring Boot + MySQL) with a JSON import schema
  for locations, characters, events, chapters, and calendar. Ask for it before designing the data
  model; adapt it rather than inventing a new one.
