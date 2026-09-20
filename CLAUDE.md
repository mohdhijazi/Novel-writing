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
      films.json              films and series set in the world
      episodes.json           each names the film it belongs to
      scenes.json             each names the episode it belongs to
      beats.json              the shots a scene is broken into
      dialogueLines.json      what is said in a scene, and over which beat
      images.json             which picture belongs to which character or location
      Images/                 the pictures themselves, one file each
        <image id>.jpg
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
- Films are the other way round: a film, its episodes and their scenes are three flat collections,
  each record naming its parent, the way relations, tickets and ticket links are. They are small
  records, so folders would buy nothing. Deleting a film tombstones its episodes and their scenes in
  one transaction, and deleting an episode its scenes — a record with no way back to it is worse than
  no record. A scene has a number and a title for now; what else it holds is still to come.
- Paragraphs are one JSON file per chapter, not one file each: a file per paragraph would mean
  renaming every later file whenever a paragraph is inserted mid-chapter.
- Upload decisions use a per-chapter revision counter (`paragraphsRevision` vs
  `paragraphsSyncedRevision`), never a timestamp comparison — a device whose clock runs ahead
  would otherwise silently suppress the other device's edits, including deletes.
- Downloads are skipped when Drive's `modifiedTime` matches the one stored at the last merge.
- Collection files are created when a world's folder is created. A world created by an older
  version keeps the files it had; there is no migration step yet.
- Drive keeps 30 days of file revisions — that is the recovery path for a bad overwrite.
- Work is always saved locally first; Drive is optional. `syncMeta` holds `lastSyncedAt`, and the
  pending count is every record with `updatedAt` above it (each table indexes `updatedAt`, so this
  is counted, never scanned). Reconnecting offers a sync instead of uploading silently; declining
  pauses automatic syncs until the user presses Sync now.

## Pictures

Pictures live in `src/features/images/` — a shared feature, the way `lib/map/` is shared:
everything about them is there, and other features use its two components. A character or a location
has **one** picture (`ImageField`); a shot beat has **as many as it needs** (`ImageGallery`, which
takes several files at once). Both store pictures the same way, through `useAddImages`; they differ
only in whether a new picture replaces the last one.

- The file the user picks is scaled to fit 1400 px and re-encoded as JPEG (`lib/images/prepareImage`)
  before it is stored. A phone photo is several megabytes; it would otherwise cost that in IndexedDB,
  in Drive and in every sync.
- The bytes never change once written. Replacing a picture tombstones the old record and writes a new
  one with a new file, so there is nothing to merge — the only question two devices can disagree about
  is which picture is current, and `updatedAt` settles that like any other record.
- `images.json` holds the records (owner, `driveFileId`, timestamps) and syncs like any other
  collection. The bytes go up as whole files in `Images/`, pushed **before** the collection file so the
  records uploaded with them already point at their file, and pulled **after** it so a record is known
  before its bytes are fetched.
- Fetching bytes does not touch `updatedAt`: the record did not change, and bumping it would send an
  unchanged file back to Drive.
- Removing a picture bins its Drive file and clears `driveFileId`, so it is binned once; deleting a
  character, location or beat removes its pictures too, so no file is left behind in Drive. Every
  transaction that can reach a beat — scene, episode, film — therefore touches `images` as well.
- A device that has the record but not the bytes says so and waits for a sync — pictures are as
  offline-friendly as everything else, but they cannot appear out of nothing.

## Scenes

A scene follows the user's scene writing template, the step that turns chapter prose into something
an image and video generator can work from. The rule the template sets, and the reason the labels
read as they do: **every field describes what a camera or a generated image would show** — visible
movement, not feeling or intent ("his hand tightens around the cup", never "he feels anxious").
Descriptive narration is left out; the visuals carry it.

- The scene's own fields are listed in `sceneFields.ts`, which drives the form the way
  `characterFields.ts` drives the character one. Adding a field is an entry there plus the type;
  `syncFilms.ts` takes the fields from `SCENE_TEXT_FIELDS`, so a new one syncs without being named
  again.
- A scene carries a **Scene ID** for tracking across the pipeline (`Ep01_Ch2_Sc3`). A new scene gets
  `Ep<episode>_Sc<scene>` as a first guess; the chapter it came from is the writer's to add.
- **Beats** are records of their own, because a generated clip runs about five seconds: a scene is a
  handful of short beats, each one image. **Dialogue lines** are records too, and name the beat they
  play over — they are the source for the dub and the subtitles later on.
- Deleting a scene tombstones its beats and its lines in the same transaction.
- Still to come from the user: more of what a scene holds.

## Importing a world

`src/features/import/` turns a file written by someone else's AI into a new world. The prompt handed
to that AI is built from `CHARACTER_FIELD_GROUPS`, so adding a character field updates the prompt
automatically — keep it that way rather than restating the fields by hand. Parsing is deliberately
forgiving: unknown keys are ignored, a record missing its name is skipped with a warning, and only a
missing `format` or world name stops the import. Imported files reference months and locations by
**name**; ids are resolved during the import.

## Exporting a novel as PDF

`src/features/novels/exportNovelPdf.ts` matches a reference book the user supplied: A5 (419.53 ×
595.28 pt), EB Garamond, justified body at 11/16 pt with an indented first line, centred chapter
headings reading "Chapter I:" over the chapter title, page number bottom-right and no running
headers. The novel's title gets a page of its own, which carries no number, so the first chapter
page reads "1". `ExportDialog` picks which chapters go in, whether to open with a title page, and the paper size;
chapters keep their own numbers whether or not their neighbours were included. Measurements live in
`pdfLayout.ts`: type sizes are fixed whatever the paper, while margins are 15% of the page width,
widening further so a line never runs past `MAX_MEASURE` — a wide page gets wider margins rather
than lines too long to read.

A line is only stretched to the measure when it already fills most of it (`MIN_JUSTIFY_RATIO`), and
a line break inside a paragraph starts a new indented paragraph. Without both, dialogue came out
pulled apart across the page.

The font is `public/fonts/EBGaramond.ttf` (the variable TTF from Google Fonts), fetched only when
exporting and falling back to jsPDF's built-in Times when it cannot be fetched. It ships one weight,
so headings are stroked slightly to carry the reference's bold. jsPDF is imported dynamically — it
is larger than the rest of the app.

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
- Deleting a world tombstones the record and moves its Drive folder to the bin, where it can still
  be recovered. The other device notices its folder has gone from the root folder, checks whether it
  was binned or merely moved elsewhere in Drive, and only deletes locally when it was binned.
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
