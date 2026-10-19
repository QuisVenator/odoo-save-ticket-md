# Changelog

All notable changes are recorded here. Versions follow semantic versioning.

## Unreleased

### Fixed

- Italic text now converts to `*emphasis*` instead of `_emphasis_`, matching
  the exporter's Markdown style and the test suite's expectations.
- Raised `strict_min_version` to `142.0` (desktop and Android both require at
  least this to support the manifest's `data_collection_permissions` key);
  `128.0` previously failed `web-ext lint --warnings-as-errors`.
- The background script now derives the ticket ID solely from the sender's
  own tab URL instead of requiring it to match the content script's
  client-supplied value. Odoo's SPA router can finish rendering a new task
  before the address bar settles, so the client-computed ID could legitimately
  lag behind by the time the background script ran, failing the download with
  "Invalid ticket download request." even though the right task was on screen.

### Validation status

- Dependencies installed cleanly; `package-lock.json` is now committed.
- `npm test`, `npm run lint`, `npm run build`, and `npm run package` all pass.
- Authenticated live Odoo and native Firefox dialog checks remain manual.

## [0.1.0] - 2026-10-16

### Added

- Download Markdown button on Odoo project task forms at `odoo.samuu.com.py`.
- Export of the current title and rich-text description, including unsaved edits.
- Native Firefox Save As dialog with the task ID as the `.md` filename.
- Markdown conversion for nested lists, tables, task lists, code, links, and images.
- Navigation-aware button placement and inline error feedback.
- Automated URL, extraction, conversion, UI lifecycle, and download-handler tests.
- Build, extension linting, packaging, and synchronized version commands.

### Validation status

- URL and mocked download-handler tests passed in the implementation environment.
- Dependency installation was blocked by network restrictions. DOM/conversion tests,
  bundling, extension linting, and packaging still require validation.
- Authenticated live Odoo and native Firefox dialog checks remain manual.
