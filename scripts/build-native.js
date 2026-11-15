const { spawnSync } = require('node:child_process');
if (process.platform === 'darwin') {
  const result = spawnSync(process.execPath, [require.resolve('node-gyp/bin/node-gyp.js'), 'rebuild'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
