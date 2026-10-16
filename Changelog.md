# Changelog

All notable changes are recorded here. Versions follow semantic versioning.

## Unreleased

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
