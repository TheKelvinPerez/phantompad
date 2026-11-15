const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
if (process.platform !== 'darwin') throw new Error('macOS is required to build the app icon');
const root = path.resolve(__dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'phantompad-icon-'));
const iconset = path.join(temporary, 'PhantomPad.iconset');
fs.mkdirSync(iconset);
try {
  for (const size of [16, 32, 128, 256, 512]) {
    for (const scale of [1, 2]) {
      const pixels = String(size * scale);
      execFileSync('sips', ['-z', pixels, pixels, path.join(root, 'assets/icon.png'), '--out',
        path.join(iconset, `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`)], { stdio: 'ignore' });
    }
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.join(root, 'assets/PhantomPad.icns')]);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
