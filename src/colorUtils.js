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
 * new array where similar colors are spread apart from each other,
 * rather than clumped together — useful so the grid reads as an even
 * mix of color rather than bands/clusters of one hue.
 *
 * Approach: bucket albums into hue groups (e.g. red, orange, yellow...),
 * sort within each bucket by lightness for a bit of internal consistency,
 * then "deal" one album at a time from each bucket in rotation so the
 * final order alternates between hue groups instead of grouping them.
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

  const withAlbum = withColor.filter((x) => x.album && x.hsl);
  const withoutAlbum = withColor.filter((x) => !x.album || !x.hsl);

  // Bucket into hue groups (12 buckets = 30deg slices around the color wheel).
  // Low-saturation (greys/blacks/whites) get their own bucket so they don't
  // skew into an arbitrary hue bucket just from noise.
  const BUCKET_COUNT = 12;
  const buckets = Array.from({ length: BUCKET_COUNT + 1 }, () => []);

  withAlbum.forEach((item) => {
    if (item.hsl.s < 0.12) {
      buckets[BUCKET_COUNT].push(item); // neutral/greyscale bucket
    } else {
      const bucketIndex = Math.floor(item.hsl.h / (360 / BUCKET_COUNT)) % BUCKET_COUNT;
      buckets[bucketIndex].push(item);
    }
  });

  // Sort within each bucket by lightness for a touch of internal order
  buckets.forEach((bucket) => bucket.sort((a, b) => a.hsl.l - b.hsl.l));

  // Shuffle bucket order each run so the same hue doesn't always start first
  const bucketOrder = buckets
    .map((bucket, i) => i)
    .filter((i) => buckets[i].length > 0)
    .sort(() => Math.random() - 0.5);

  // Round-robin deal: take one from each non-empty bucket in turn
  const dispersed = [];
  let remaining = withAlbum.length;
  while (remaining > 0) {
    for (const bucketIndex of bucketOrder) {
      const bucket = buckets[bucketIndex];
      if (bucket.length > 0) {
        dispersed.push(bucket.shift());
        remaining--;
      }
    }
  }

  return [...dispersed, ...withoutAlbum].map((x) => x.album);
}