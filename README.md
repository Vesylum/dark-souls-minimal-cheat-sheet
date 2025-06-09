# Dark Souls Minimal Cheat Sheet

This repository contains the code for the **Dark Souls Minimal Cheat Sheet**. The site provides a step‑by‑step checklist for the original game and saves your progress locally so you can pick up where you left off.

[View the live site here.](https://vesylum.github.io/dark-souls-minimal-cheat-sheet/)

## Development

All files are static HTML, CSS and JavaScript. Clone the repo and serve the directory with a local HTTP server. Run `npm start` to launch the locally installed `serve` package, or run `python -m http.server` in the project root and then open the provided URL in your browser.
Before serving, generate the service worker with `npm run build` so the cache name includes the current version.

Checklist content now lives in `data/playthrough.json`. This file lists each playthrough section and the items within it. The JavaScript fetches this JSON on page load and generates the checklist dynamically.
Individual sections are collapsible using the native `<details>`/`<summary>` elements with the first section expanded by default.

Development and the test suite expect **Node.js 20** or newer and use Node's ES module support. The `package.json` file sets `"type": "module"` so Node treats `*.js` files as ES modules. You can check your installed version with `node --version`.
An `.nvmrc` file at the project root pins this version for `nvm` users; run `nvm use` after cloning.
When installing dependencies, run `npm ci` to guarantee a reproducible environment.
The Node build scripts use ES module syntax. `package.json` sets `"type": "module"` so Node treats `.js` files as ES modules.

## Running Tests

A small QUnit test suite validates the client-side logic. Install dependencies with `npm ci` for reproducible installs and run the tests with:

```bash
npm ci
npm test
```

The tests execute under Node.js using jsdom to simulate a browser environment.

## Exporting and Importing Progress

The site stores your checklist data in the browser. Click **Export Progress** to
copy it as a JSON string. Use **Import Progress** to paste that string into
another browser or after clearing your storage to restore your progress.

## Service Worker Cache

The service worker caches `index.html`, CSS, JavaScript and JSON data so the
site works offline. Run `npm run build` whenever files change to regenerate
`service-worker.js` with a versioned `CACHE_NAME`. Older caches with different
names are deleted during the service worker's `activate` event. You can also
manually clear storage from your browser's developer tools if needed.

## License

This project is licensed under the [MIT License](LICENSE).

