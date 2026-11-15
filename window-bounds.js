function restoreBounds(saved, area) {
  const width = Math.min(area.width, Math.max(280, Number.isFinite(saved.width) && saved.width > 0 ? saved.width : 420));
  const height = Math.min(area.height, Math.max(240, Number.isFinite(saved.height) && saved.height > 0 ? saved.height : 720));
  const x = Number.isFinite(saved.x) ? saved.x : area.x + (area.width - width) / 2;
  const y = Number.isFinite(saved.y) ? saved.y : area.y + (area.height - height) / 2;
  return {
    x: Math.round(Math.max(area.x, Math.min(x, area.x + area.width - width))),
    y: Math.round(Math.max(area.y, Math.min(y, area.y + area.height - height))),
    width: Math.round(width), height: Math.round(height)
  };
}
module.exports = { restoreBounds };
