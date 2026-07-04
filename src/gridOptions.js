// Shared grid size options for the album wallpaper.
// Pulled out of PreferencePanel.js so Dashboard.js can also use it to
// auto-pick the best-fit grid for the user's screen on load.
export const GRIDS = [
  { cols: 8,  rows: 5, label: '8 × 5  (40 albums)' },
  { cols: 10, rows: 6, label: '10 × 6  (60 albums)' },
  { cols: 12, rows: 6, label: '12 × 6  (72 albums)' },
];

// Given a screen width/height (in any consistent unit — pixels here),
// returns whichever GRIDS entry has an aspect ratio closest to the
// screen's own aspect ratio. E.g. a 16:9 monitor (ratio ~1.78) lands
// closest to the 12x6 grid (ratio 2.0) vs 8x5 (1.6) or 10x6 (1.667).
export function pickBestGrid(screenW, screenH) {
  const targetRatio = screenW / screenH;
  let best = GRIDS[0];
  let bestDiff = Infinity;

  for (const g of GRIDS) {
    const gridRatio = g.cols / g.rows;
    const diff = Math.abs(gridRatio - targetRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = g;
    }
  }
  return best;
}