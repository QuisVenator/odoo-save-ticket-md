# Odoo Ticket Markdown

Firefox extension that adds **Download Markdown** beside the task form's Create
button on `https://odoo.samuu.com.py`.

The export contains the current ticket name as a level-one heading followed by
its description as Markdown, including unsaved edits. Firefox opens its normal
Save As dialog with the final task ID as the filename, e.g. `70584.md`.

## Setup and build

Use Node.js 20.19 or newer and an npm version compatible with it (npm 10 supports
Node 20). The machine used for implementation has npm 12 with Node 20; switch to
npm 10 or a supported newer Node runtime before installing.

```sh
npm install
npm test
npm run lint
npm run package
```

`npm install` generates `package-lock.json`; commit it before distributing a
release, then use `npm ci` for subsequent clean installs. Registry access was
unavailable during implementation, so a lockfile and verified package could not
be generated here. Direct dependencies are pinned in `package.json`.

The build writes `dist/`; packaging writes an unsigned archive to `artifacts/`.
Neither generated directory is tracked. All runtime dependencies are bundled
into the extension; no remote scripts are loaded.

## Try it in Firefox

1. Run `npm run build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on**, then select `dist/manifest.json`.
4. Open a project task on `odoo.samuu.com.py` and click **Download Markdown**.
5. Choose a destination in the native Save As dialog.

Alternatively, `npm start` launches a separate development Firefox profile with
the extension installed. Log into Odoo in that profile. Temporary installations
last until Firefox closes. Permanent installation in standard Firefox requires
Mozilla signing; this project does not publish or sign automatically.

## Supported content and limitations

- Targets the Odoo 19 project task form represented by the saved reference, with
  URLs such as `/odoo/action-257/185/tasks/7264/185/project.task/70584`.
- Requires Firefox desktop 128 or newer. Other domains, Helpdesk layouts, and
  alternate Odoo URL formats are not supported in this first release.
- Exports rendered form content without saving the task or calling Odoo APIs.
  If the description is not rendered, open its tab and retry.
- Includes paragraphs, headings, nested lists, emphasis, blockquotes, code,
  GFM tables and task lists. Empty descriptions produce a title-only document.
- Links and images use absolute URLs. Images and attachments are not embedded;
  access to private images may still require an authenticated Odoo session.
- Chatter, comments, attachments, and other ticket metadata are excluded.
- Processing stays local. The extension needs access to the one Odoo domain
  to insert its button and the `downloads` permission to open Save As.

## Tests and manual acceptance

`npm test` runs Node tests with jsdom and mocked Firefox APIs. The committed HTML
fixture is synthetic and contains no actual ticket/customer content. The supplied
`references/` directory remains local and is excluded from Git and packaging.

Before release, run all automated checks, then verify in an authenticated Firefox
session:

- One button appears on a task form and survives Odoo form rerendering.
- Moving between tasks without a reload exports the current task and filename.
- Unsaved title and description edits appear in the Markdown file.
- German characters, lists, links, and code render correctly after downloading.
- Save As opens even when Firefox normally saves downloads automatically.
- Cancelling the dialog is quiet and allows another attempt.
- Navigating away from tasks removes the button; no task is modified or saved.

## Git and releases

The workspace's `.git` directory is mounted read-only. Project history is kept
in `.git-local` instead. While using this workspace, prefix Git commands with:

```sh
git --git-dir=.git-local --work-tree=. status
```

Outside the restricted environment, if `.git` is still the empty placeholder,
copy the contents of `.git-local` into it to restore ordinary Git commands:

```sh
cp -a .git-local/. .git/
git status
```

Do this only for the empty placeholder, not an existing repository with its own
history. The supplied references and build artifacts are excluded from history.
No remote repository is configured.

For a release, update both versions with `npm run version:set -- 0.1.1`, move the
relevant `Unreleased` changes into a dated section in `Changelog.md`, run tests,
lint and package, then commit and tag `v0.1.1`. The version command also updates
the lockfile when present; the build rejects mismatched package/manifest versions.
Use patch versions for fixes, minor versions for compatible features, and major
versions for breaking changes. The initial `v0.1.0` tag should be created only
after the outstanding validation above passes.

## Technical references

- [Firefox downloads API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/downloads/download)
- [Firefox temporary installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)
- [Turndown](https://github.com/mixmark-io/turndown)
