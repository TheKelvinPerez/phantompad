<p align="center">
  <img src="assets/icon.png" width="160" alt="PhantomPad paper ghost icon">
</p>

# PhantomPad

A transparent Markdown notepad that stays above your work and follows you across
macOS workspaces, including AeroSpace. Keep a thought, a checklist, or a reference
close by without switching away from what you are doing.

## Why I built it

PhantomPad was inspired by **GhostPad by yahitscara**. I liked its simple,
transparent notepad idea, but I couldn't get the updates I needed or reach its
website, so I recreated it for my own workflow. PhantomPad adds a macOS panel
that works with AeroSpace, safer file handling, and a modern sans serif editor.

The original [GhostPad repository](https://github.com/yahitscara/GhostPad) and
[website](https://ghostpad.io/) were unavailable when checked on November 15,
2026. That describes their availability at the time, not their future status.
PhantomPad is an independent project and is not affiliated with GhostPad.

## Features

- Transparent, always-on-top editor with adjustable opacity.
- A macOS panel that follows workspace changes without taking over the active app.
- Open and save Markdown or plain text files, including files in an Obsidian vault.
- Autosave every two seconds after a file has a saved location.
- Save, discard, and cancel protection before opening, creating, or quitting a note.
- Light and dark themes, optional dimming, and persistent window bounds.
- Native system sans serif typography and a dedicated app icon.
- Launch from Vicinae or another macOS application launcher.

The editor works with Markdown source text. It does not render a Markdown preview.

## Install on macOS

Download the Apple Silicon ZIP from [Releases](https://github.com/TheKelvinPerez/phantompad/releases),
extract it, and copy **PhantomPad.app** into `~/Applications` or `/Applications`.
Then search for **PhantomPad** in your launcher.

The provided build is locally ad-hoc signed, not Developer ID signed or Apple
notarized. macOS may prevent it from opening. You can build it yourself using the
instructions below. Intel builds can be produced on an Intel Mac; an Intel
release binary is not currently provided.

PhantomPad runs as an accessory app, so it intentionally has no persistent Dock
icon. Launching it again restores a hidden pad. Quit a running copy before
replacing its application bundle.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Show or hide the pad | Control + Option + Shift + P |
| New note | Command + N |
| Open file | Command + O |
| Save | Command + S |
| Quit with unsaved-change protection | Command + Q |
| Hide from the editor | Escape |

For a different global toggle when running from source:

```bash
PHANTOMPAD_HOTKEY="Alt+P" npm start
```

## Build from source

You need Node.js 26 or later. On macOS, the small native bridge also requires
Xcode Command Line Tools and Python.

```bash
git clone https://github.com/TheKelvinPerez/phantompad.git
cd phantompad
npm ci
npm test
npm run check
npm start
```

Create a macOS application and ZIP for the current Mac's architecture:

```bash
npm run package:mac
```

Packaging rebuilds the native bridge, creates all icon sizes, bundles the app,
and verifies its local signature. Outputs are written to `dist/`.

## AeroSpace and platform support

On macOS, Electron's `type: 'panel'` creates an `ElectronNSPanel`. A small
Node-API bridge marks it as an accessibility overlay so AeroSpace leaves it
outside its managed window tree. It does not need a floating-follow script.
The editor and custom controls remain accessible.

This behavior was verified with AeroSpace 0.21.3-Beta. Recheck it after an
AeroSpace upgrade because its window-detection heuristics can change.
Native full-screen behavior has not been validated.

Windows and Linux use Electron's fallback always-on-top behavior. Those
platforms have not been tested, and macOS panel behavior is not promised there.

## Your files and preferences

Notes stay in the files you choose. Unsaved notes remain in memory and are not
recovered after a crash. Theme, opacity, and window bounds are stored locally
under `~/Library/Application Support/phantompad` on macOS. Source and packaged
copies share those preferences and should not run simultaneously.

PhantomPad has no account requirement, telemetry, or automatic update service.
Update by installing a newer release.

## Contributing

Bug reports and focused improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md)
for the development checks and what to include in a report.

## License and attribution

[MIT](LICENSE). Includes adapted editor and file-handling code from GhostPad,
whose application identifies yahitscara as its author and declares the MIT
license. The original attribution is retained in the license. The macOS overlay
bridge and additional file safety behavior are maintained as part of PhantomPad.
