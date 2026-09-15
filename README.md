# Novel Writing

An offline-first planner for a novel's world — characters, locations, events, chapters, and
timeline — that syncs between devices through Google Drive.

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
