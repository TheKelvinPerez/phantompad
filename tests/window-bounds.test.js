const { test } = require('node:test');
const assert = require('node:assert/strict');
const { restoreBounds } = require('../window-bounds');
test('restores offscreen notes inside the selected display work area', () => {
  assert.deepEqual(restoreBounds({ x: -51, y: 1045, width: 532, height: 570 }, { x: 0, y: 25, width: 1440, height: 875 }),
    { x: 0, y: 330, width: 532, height: 570 });
});
test('rejects corrupt sizes and fits small displays', () => {
  assert.deepEqual(restoreBounds({ x: Infinity, width: -1, height: 9000 }, { x: -800, y: 0, width: 800, height: 600 }),
    { x: -610, y: 0, width: 420, height: 600 });
});
