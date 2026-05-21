/**
 * Estrae il colore dominante (vivido) da una dataURL immagine,
 * scartando bianco/grigio/nero. Lavora 100% offline su canvas.
 */
export async function dominantColor(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const W = (canvas.width = 80);
  const H = (canvas.height = 80);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  const buckets = new Map<string, { r: number; g: number; b: number; n: number; s: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 200) continue;
    const { s, l } = rgbToHsl(r, g, b);
    if (l < 0.12 || l > 0.9) continue;     // scarta nero/bianco
    if (s < 0.18) continue;                // scarta grigi
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0, s: 0 };
    bucket.r += r; bucket.g += g; bucket.b += b; bucket.n += 1; bucket.s += s;
    buckets.set(key, bucket);
  }
  if (buckets.size === 0) return "#0f172a";
  // scegli bucket col miglior score = frequenza * saturazione media
  let best = { score: 0, r: 15, g: 23, b: 42 };
  for (const b of buckets.values()) {
    const score = b.n * (b.s / b.n);
    if (score > best.score) best = { score, r: b.r / b.n, g: b.g / b.n, b: b.b / b.n };
  }
  return rgbToHex(best.r, best.g, best.b);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  }
  return { s, l };
}

function rgbToHex(r: number, g: number, b: number) {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Tenta di indovinare un URL logo dal nome brand usando il servizio
 * pubblico Clearbit Logo. Se il logo non esiste, l'<img> fallirà
 * silenziosamente e mostreremo il fallback testuale.
 */
export function guessLogoUrl(brand: string): string | null {
  const slug = brand
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  if (slug.length < 2) return null;
  return `https://logo.clearbit.com/${slug}.com`;
}
