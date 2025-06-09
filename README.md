# Dark Souls Minimal Cheat Sheet

This repository contains the code for the **Dark Souls Minimal Cheat Sheet**. The site provides a step‑by‑step checklist for the original game and saves your progress locally so you can pick up where you left off.

[View the live site here.](https://vesylum.github.io/dark-souls-minimal-cheat-sheet/)

## Development

All files are static HTML, CSS and JavaScript. Clone the repo and serve the directory with a local HTTP server. Run `npm start` to launch the locally installed `serve` package, or run `python -m http.server` in the project root and then open the provided URL in your browser.
Before serving, generate the service worker with `npm run build` so the cache name includes the current version.
Rebuild the service worker with the same command whenever any static files (HTML, CSS, JavaScript or JSON) change so cached assets stay up to date.

Checklist content now lives in `data/playthrough.json`. This file lists each playthrough section and the items within it. The JavaScript fetches this JSON on page load and generates the checklist dynamically.
Individual sections are collapsible using the native `<details>`/`<summary>` elements with the first section expanded by default.

Development and the test suite require **Node.js 20** or newer and use Node's ES module support. An `.nvmrc` file pins this version for `nvm` users; run `nvm use` after cloning and `npm ci` to install dependencies.

## Running Tests

A small QUnit test suite validates the client-side logic. Install dependencies with `npm ci` for reproducible installs and run the tests with:

```bash
npm ci
npm test
npm run test:ui
```

The tests execute under Node.js using jsdom to simulate a browser environment.
Run `npm run lint` to check code style across the `js/` directory and the `tests/` sources. A
separate UI test exercises localStorage integration and can be executed with `npm run test:ui`.

## Filtering Items

Both the Playthrough and Checklists tabs have a search field above the sections.
Entering text there hides list items that do not contain the query. Filtering is
purely visual and does not modify your saved progress.

## Exporting and Importing Progress

The site stores your checklist data in the browser. Click **Export Progress** to
download it as a JSON file. Use **Import Progress** and choose that file to
restore your progress after clearing your storage or on another browser.

## Service Worker Cache

The service worker caches `index.html`, CSS, JavaScript and JSON data so the
site works offline. Run `npm run build` whenever static files change to regenerate
`service-worker.js` with a versioned `CACHE_NAME`. Older caches with different
names are deleted during the service worker's `activate` event. You can also
manually clear storage from your browser's developer tools if needed.

## License

This project is licensed under the [MIT License](LICENSE).

