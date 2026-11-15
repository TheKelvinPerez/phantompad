# PhantomPad

A transparent markdown overlay pad for macOS that follows you across every
workspace. Built for use with AeroSpace, where a plain always-on-top window
does not follow you between workspaces but a non-activating panel that joins
all spaces does.

## How the panel behavior works

The window is created with `type: 'panel'`, which makes Electron use its
native `ElectronNSPanel` window class on macOS. That class adds the
`NSWindowStyleMaskNonactivatingPanel` style mask and forces
`NSWindowCollectionBehaviorCanJoinAllSpaces` plus
`NSWindowCollectionBehaviorFullScreenAuxiliary`, which is exactly what a
Stickies-style panel gets:

- The pad appears in every space, so it follows you between AeroSpace
  workspaces
- Clicking the pad never activates the app, so whatever you are working in
  keeps its active status and menu bar while the pad receives keyboard input
- The pad stays visible over full-screen apps

On top of that the window is transparent, frameless, borderless, shadow-free,
and pinned with the `screen-saver` always-on-top level.

## What it does

- Markdown and text files: open, save, new note
- Autosave every 2 seconds once the note has a file path
- Unsaved-changes guards on new, open, and quit
- Opacity slider (10 to 100 percent), light and dark mode
- Dims when it is not the key window, brightens when you click into it
- Window position and size persist across sessions
- Toggle the pad with a global hotkey, Control+Option+Shift+P by default
- Esc hides the pad, close button hides instead of quitting

## AeroSpace

The macOS bridge sets the panel's accessibility subrole to `AXUnknown` and
removes its native accessibility close button. AeroSpace then treats it as
an overlay rather than a managed window. The custom editor and controls
remain accessible. No floating-follow script is needed.

This has been verified with AeroSpace 0.21.3-Beta. Its window-detection
heuristics can change, so check that PhantomPad remains absent from
`aerospace list-windows --all` after an AeroSpace upgrade.

## Run it

```bash
npm ci
npm test
npm start
```

On macOS, installation builds a small Node-API bridge with Xcode Command
Line Tools and Python. Electron is pinned in the lockfile. Run `npm run build`
to rebuild the bridge, and `npm run check` for JavaScript syntax checks.
The start script clears an inherited `ELECTRON_RUN_AS_NODE`, including when
launched from a desktop development tool.

The current deliverable runs from source. A signed, packaged application
and installer are not included.

## Hotkey

Default is Control+Option+Shift+P, keeping Space shortcuts available for voice transcription. Override with an environment variable:

```bash
PHANTOMPAD_HOTKEY="Alt+P" npm start
```

Electron accelerator syntax applies, for example "Alt+Space", "Ctrl+Alt+P",
"CmdOrCtrl+Shift+D".

## Notes

- On Windows and Linux the pad falls back to Electron's built-in
  visible-on-all-workspaces plus always-on-top behavior.
- Markdown preview is a planned extension, the editor is plain text for now.

## Attribution

Inspired by GhostPad by yahitscara. Includes adapted editor and file-handling
code from its MIT-licensed application. The macOS overlay bridge and additional
data-loss protection are maintained as part of PhantomPad.
