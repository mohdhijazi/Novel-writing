# Worlds

An offline-first world-building app — characters, locations, events, timeline, and the links
between them — that syncs between devices through Google Drive. Novels set in a world come later.

Live at https://mohdhijazi.github.io/Novel-writing/

## Development

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev      # http://localhost:5173/Novel-writing/
npm run check    # type check, lint, format check
npm run build    # production build in dist/
npm run preview  # serve the production build (service worker enabled)
```

Pushing to `main` deploys to GitHub Pages via GitHub Actions.
