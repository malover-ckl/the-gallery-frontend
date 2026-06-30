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

/**
 * Given an array of album objects (each with a `url`), resolves to a
 * new array sorted by hue, then lightness, so similar colors cluster
 * together across the grid (like a gradient sweep).
 */
export async function sortAlbumsByColor(albums) {
  const colors = await Promise.all(
    albums.map((album) => (album ? getAverageColor(album.url) : Promise.resolve(null)))
  );

  const withColor = albums.map((album, i) => {
    if (!album || !colors[i]) return { album, hsl: null };
    const { r, g, b } = colors[i];
    return { album, hsl: rgbToHsl(r, g, b) };
  });

  // Keep empty slots (null albums) at the end, sort the rest by hue then lightness
  const withAlbum = withColor.filter((x) => x.album && x.hsl);
  const withoutAlbum = withColor.filter((x) => !x.album || !x.hsl);

  withAlbum.sort((a, b) => {
    if (Math.abs(a.hsl.h - b.hsl.h) > 1) return a.hsl.h - b.hsl.h;
    return a.hsl.l - b.hsl.l;
  });

  return [...withAlbum, ...withoutAlbum].map((x) => x.album);
}