# Chapter — Book Tracker

A little space for your reading life. Chapter is a responsive book tracker built with plain HTML, CSS, and JavaScript for the Globocon mini-product brief. It uses browser local storage, so no account, backend, or database is needed.

## Features

- Add a book with a required title, required author, and **To read**, **Reading**, or **Finished** status.
- Show the newest additions first; changing status does not reorder a book.
- Search by title or author, ignoring case and common diacritics.
- Change reading status directly on each card.
- Save books and their statuses across page refreshes using `localStorage`.
- Filter by status and view total/status counts.
- Delete a book with a ten-second undo opportunity for the latest deletion.
- Use the app on a phone or desktop.
- Optional sample books, added only when requested from an empty library.
- Keyboard shortcuts: **N** opens Add book; **/** focuses search; **Escape** closes the dialog. Shortcuts do not trigger while typing in an input.

## Run locally

With Node.js installed, run from the project folder:

```sh
npm start
```

Open the printed address, normally `http://127.0.0.1:3000`. No dependency installation is required. Alternatively, serve the project folder with any static web server.

```sh
npm run check  # Check JavaScript syntax
npm run build  # Copy the four web assets to dist/ for static hosting
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, navigation, book form, and feedback regions |
| `styles.css` | Responsive design, book artwork, focus indicators, and motion preferences |
| `app.js` | Validation, book state, filtering, rendering, local storage, and undo |
| `favicon.svg` | Original book icon |
| `PROMPTS.md` | Honest prompt excerpts, workflow outcomes, and an actual bug/fix |
| `TESTING.md` | Checks performed and steps to reproduce the corrected bug |
| `WALKTHROUGH.md` | Explanation of the code and a short demo plan |
| `scripts/` | Optional dependency-free local server and static asset copying |

The four web assets in the repository root are the source of truth. `dist/` is generated hosting output; do not edit it directly. `.openai/hosting.json`, if present, configures the Sites deployment and is not needed to run the application.

## How it works

Each book contains `id`, `title`, `author`, `status`, and `createdAt`. New records are inserted at the front of the array. The complete array is serialized to JSON under the key `chapter.books.v1` after changes, and validated before loading.

Search and status filters produce a view of the array without modifying stored data. Counts describe the full library, while the result line describes the currently visible books. User-supplied titles and authors are rendered using `textContent`, not inserted as HTML.

Existing valid data is not silently overwritten if stored JSON is unreadable. The app offers a raw backup download and an explicitly confirmed reset. Storage write failures are shown to the user instead of claiming that changes were saved.

Sequential changes from another tab are reflected through the browser's `storage` event, including while the add-book dialog is open. Browser local storage has no transaction mechanism: truly simultaneous edits can still overwrite one another. This is a personal, single-user tracker, not a collaborative database.

## Design decisions

- A warm paper palette, dark green controls, editorial headings, and original CSS book artwork give the app a reading-focused identity.
- Adding a book uses a native modal dialog with labels, inline validation, and focus restoration.
- Sample content is opt-in; a fresh visitor starts with an empty library.
- Status is expressed with words as well as colour.
- Layout supports narrow phone screens; reduced-motion preferences disable animation without breaking layout transforms.
- No application framework or runtime JavaScript dependency. Google Fonts supplies optional typefaces; system fallbacks keep the app usable if those font requests fail.

## Hosting

Any static host can serve `index.html`, `styles.css`, `app.js`, and `favicon.svg` together. For GitHub Pages, publish the repository's main branch from the root folder. For a host that expects a build directory, run `npm run build` and publish `dist/`.

No API keys or environment secrets are required. Data belongs to the browser origin: local preview and a hosted site have separate libraries. Clearing browser data or changing browsers/devices does not preserve or transfer the library.

## AI assistance

AI assistance was used for implementation, design, documentation, and browser verification. `PROMPTS.md` distinguishes the user's actual combined request from assistant-organized work and records an observed failure rather than inventing a development story.
