// colorUtils.js
// Extracts a dominant color from an album cover image and provides
// a hue/lightness based sort so the grid can be "color balanced".

/**
 * Loads an image and returns its average RGB color by sampling a
 * downscaled canvas (cheap dominant-color approximation).
 */
function getAverageColor(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const size = 16; // small sample size is enough for average color
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);

        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0, g = 0, b = 0;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }

        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);

        resolve({ r, g, b });
      } catch (err) {
        // Canvas read can fail if the image didn't actually allow CORS
        // (tainted canvas). Fall back to a neutral gray so the album
        // still gets placed somewhere instead of breaking the sort.
        resolve({ r: 128, g: 128, b: 128 });
      }
    };

    img.onerror = () => resolve({ r: 128, g: 128, b: 128 });
    img.src = url;
  });
}

/** Converts RGB (0-255 each) to HSL ({h: 0-360, s: 0-1, l: 0-1}). */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
      default: break;
    }
    h *= 60;
  }

  return { h, s, l };
}

/** Color distance combining hue, saturation, and lightness so that
 * desaturated/grey covers aren't treated as "close" just because hue
 * is meaningless at low saturation, and so brightness differences count too.
 */
function colorDistance(a, b) {
  if (!a || !b) return 0; // unknown colors don't penalize placement
  // Hue is circular (0-360), take the shorter distance around the wheel
  const hueDiff = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180; // 0-1
  const satDiff = Math.abs(a.s - b.s);
  const lightDiff = Math.abs(a.l - b.l);
  // Weight hue most heavily, but let saturation/lightness break ties
  // (e.g. two greys both with s≈0 but very different l should still count as different)
  return hueDiff * 0.6 + satDiff * 0.2 + lightDiff * 0.2;
}

/**
 * Given an array of album objects (each with a `url`) and the grid's
 * column count, resolves to a new array arranged so that colors are
 * dispersed across actual 2D grid neighbors (left, right, top, bottom,
 * and diagonals) rather than just spread out in sequence order.
 *
 * Algorithm: greedy placement, filling the grid cell by cell (row by
 * row). For each empty cell, look at its already-placed neighbors and
 * pick whichever remaining album has the highest minimum color distance
 * from those neighbors (i.e. the album that clashes least with what's
 * already next to it).
 */
export async function sortAlbumsByColor(albums, cols) {
  const colors = await Promise.all(
    albums.map((album) => (album ? getAverageColor(album.url) : Promise.resolve(null)))
  );

  const items = albums.map((album, i) => {
    if (!album || !colors[i]) return { album, hsl: null };
    const { r, g, b } = colors[i];
    return { album, hsl: rgbToHsl(r, g, b) };
  });

  const withAlbum = items.filter((x) => x.album && x.hsl);
  const withoutAlbum = items.filter((x) => !x.album || !x.hsl);

  const total = withAlbum.length;
  if (total === 0 || !cols) {
    // No grid info or nothing to place — fall back to original order
    return [...withAlbum, ...withoutAlbum].map((x) => x.album);
  }

  const remaining = [...withAlbum];
  const grid = new Array(total).fill(null); // final placed items, indexed by flat position

  const neighborOffsets = [-cols - 1, -cols, -cols + 1, -1, 1, cols - 1, cols, cols + 1];

  for (let pos = 0; pos < total; pos++) {
    const col = pos % cols;

    // Gather colors of already-placed neighbors (skip wrap-around at row edges)
    const neighborColors = [];
    for (const offset of neighborOffsets) {
      const nPos = pos + offset;
      if (nPos < 0 || nPos >= total) continue;
      const nCol = nPos % cols;
      // Prevent wrapping from the left edge to the right edge or vice versa
      if (Math.abs(nCol - col) > 1) continue;
      if (grid[nPos]) neighborColors.push(grid[nPos].hsl);
    }

    if (neighborColors.length === 0 || remaining.length === 1) {
      // First cell (or last remaining album) — nothing to compare against
      grid[pos] = remaining.shift();
      continue;
    }

    // Pick the remaining album whose worst-case (minimum) distance to any
    // neighbor is the largest — i.e. it doesn't closely match any neighbor
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      let minDist = Infinity;
      for (const nColor of neighborColors) {
        const d = colorDistance(candidate.hsl, nColor);
        if (d < minDist) minDist = d;
      }
      if (minDist > bestScore) {
        bestScore = minDist;
        bestIndex = i;
      }
    }

    grid[pos] = remaining.splice(bestIndex, 1)[0];
  }

  return [...grid, ...withoutAlbum].map((x) => x.album);
}