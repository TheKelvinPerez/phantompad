# PhantomPad

Transparent Markdown notepad using Electron and a small macOS Node-API bridge.

- `npm ci` installs the pinned dependencies and builds the macOS bridge.
- `npm test` runs the file safety, quit lifecycle, and window restoration tests.
- `npm run check` checks JavaScript syntax.
- `npm start` launches the app. macOS requires Xcode Command Line Tools and Python.
- Default toggle: Control+Option+Shift+P. Preserve Hex's voice transcription shortcuts.
- Preserve unsaved-note guards and serialized saves when changing file handling.
- The macOS panel must remain outside AeroSpace management. Verify absence from
  `aerospace list-windows --all`, keyboard input without activation, and visible
  bounds across workspace switches when changing native window behavior.
- Keep notes, user preferences, credentials, build output, and node_modules out of Git.
- `npm run package:mac` builds a locally signed app and ZIP. Keep packaging outputs out of Git.
- Public Developer ID signing, notarization, and native fullscreen validation are unfinished.
