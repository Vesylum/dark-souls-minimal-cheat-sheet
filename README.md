# Dark Souls Minimal Cheat Sheet

This repository contains the code for the **Dark Souls Minimal Cheat Sheet**. The site provides a step‑by‑step checklist for the original game and saves your progress locally so you can pick up where you left off.

[View the live site here.](https://vesylum.github.io/dark-souls-minimal-cheat-sheet/)

## Development

All files are static HTML, CSS and JavaScript. Clone the repo and open `index.html` in your browser to run it locally.

Development and the test suite expect **Node.js 20** or newer. You can check your installed version with `node --version`.

## Running Tests

A small QUnit test suite validates the client-side logic. Install dependencies with `npm install` or use `npm ci` for reproducible installs and run the tests with:

```bash
npm install
npm test
```

The tests execute under Node.js using jsdom to simulate a browser environment.

## License

This project is licensed under the [MIT License](LICENSE).

