# Dark Souls Minimal Cheat Sheet

This repository contains the code for the **Dark Souls Minimal Cheat Sheet**. The site provides a step‑by‑step checklist for the original game and saves your progress locally so you can pick up where you left off.

[View the live site here.](https://vesylum.github.io/dark-souls-minimal-cheat-sheet/)

## Development

All files are static HTML, CSS and JavaScript. Clone the repo and open `index.html` in your browser to run it locally.

Checklist content now lives in `data/playthrough.json`. This file lists each playthrough section and the items within it. The JavaScript fetches this JSON on page load and generates the checklist dynamically.

Development and the test suite expect **Node.js 20** or newer. You can check your installed version with `node --version`.
An `.nvmrc` file at the project root pins this version for `nvm` users; run `nvm use` after cloning.
When installing dependencies, run `npm ci` to guarantee a reproducible environment.

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

## License

This project is licensed under the [MIT License](LICENSE).

