# Novel Writing

A planner for the user's novel: characters, locations, events, chapters, a calendar/timeline, and
the links between them. Used on a Windows PC and an iPad.

## Architecture (decided — don't relitigate unless asked)

- **One PWA** (Vite + React + TypeScript), hosted on GitHub Pages at
  `https://mohdhijazi.github.io/Novel-writing/`. Installed via "Add to Home Screen" (iPad) or
  "Install app" (Chrome/Edge). No Electron/Tauri/native builds.
- **Local-first:** IndexedDB is the source of truth on each device; the app must work fully offline.
- **Sync:** directly to the Google Drive REST API (Google Identity Services, scope `drive.file`),
  JSON file(s) in Drive. No backend server.
- **Conflicts:** last-write-wins per record by `updatedAt`. Single user, two devices — keep it simple.
- Deletes must be soft (`deletedAt`), otherwise sync resurrects deleted records.

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
- **Imports:** use the `@/` alias for anything outside the current feature folder.
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
