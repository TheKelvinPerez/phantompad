# Contributing

Use Node.js 26 or later. macOS development also needs Xcode Command Line Tools
and Python for the native panel bridge.

```bash
npm ci
npm test
npm run check
```

For bugs, include your macOS version, Mac architecture, PhantomPad version,
AeroSpace version if relevant, and the steps that reproduce the issue. Use a
sample note rather than private content in screenshots or attachments.

Keep changes focused. File-handling changes should include regression tests for
data loss, failed writes, cancellation, or concurrent edits as appropriate.
For native panel changes, check keyboard input, workspace switching, hide and
restore behavior, and confirm that AeroSpace does not manage the panel.

Run `npm run package:mac` before proposing packaging changes. Never commit notes,
preferences, credentials, dependencies, or the generated `dist/` and `build/`
folders. The app icon source and ICNS asset belong in `assets/`.

Open a pull request describing the user-visible change and how you verified it.
