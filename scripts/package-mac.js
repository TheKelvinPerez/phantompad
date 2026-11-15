const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

async function main() {
  if (process.platform !== 'darwin') throw new Error('Build the macOS package on macOS');
  const root = path.resolve(__dirname, '..');
  const run = (file, args) => execFileSync(file, args, { cwd: root, stdio: 'inherit' });
  run(process.execPath, ['scripts/build-native.js']);
  run(process.execPath, ['scripts/make-icon.js']);
  const { packager } = await import('@electron/packager');
  const included = ['main.js', 'preload.js', 'window-bounds.js', 'package.json', 'LICENSE',
    'renderer', 'build/Release/panel.node'];
  const [directory] = await packager({
    dir: root, name: 'PhantomPad', platform: 'darwin', arch: process.arch,
    electronVersion: require('../package.json').devDependencies.electron,
    out: path.join(root, 'dist'), overwrite: true,
    icon: path.join(root, 'assets/PhantomPad.icns'),
    appBundleId: 'dev.kelvinperez.phantompad',
    appCopyright: 'Copyright 2026 Kelvin Perez',
    extendInfo: { LSUIElement: true },
    asar: { unpack: '**/*.node' }, prune: false,
    ignore: file => {
      const relative = file.replace(/^\/+/, '');
      return relative !== '' && !included.some(item => relative === item || relative.startsWith(item + '/') || item.startsWith(relative + '/'));
    }
  });
  const app = path.join(directory, 'PhantomPad.app');
  run('codesign', ['--force', '--deep', '--sign', '-', '--preserve-metadata=entitlements', app]);
  run('codesign', ['--verify', '--deep', '--strict', app]);
  const archive = path.join(root, 'dist', `PhantomPad-${require('../package.json').version}-mac-${process.arch}.zip`);
  if (fs.existsSync(archive)) fs.unlinkSync(archive);
  run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, archive]);
  console.log(`App: ${app}\nArchive: ${archive}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
