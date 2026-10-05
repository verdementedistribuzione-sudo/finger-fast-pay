import Tesseract from "tesseract.js";

export type CardOCR = {
  pan: string | null;
  exp: string | null;       // formato MM/AA
  holder: string | null;
  rawText: string;
};

/**
 * OCR su foto di carta: usa Tesseract.js (riconoscimento off-line, nel
 * browser). Estrae numero PAN (13-19 cifre), scadenza MM/AA, titolare.
 * Niente dato lascia il device.
 */
export async function ocrCard(
  imageDataUrl: string,
  onProgress?: (p: number) => void,
): Promise<CardOCR> {
  let input = imageDataUrl;
  try { input = await autoCropCard(imageDataUrl); } catch { /* usa originale */ }
  const { data } = await Tesseract.recognize(input, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) onProgress(m.progress);
    },
  });
  const text = data.text || "";

  // PAN: cerca 13-19 cifre con possibili spazi/trattini
  const panMatch = text
    .replace(/[^\d\s-]/g, " ")
    .match(/(?:\d[\s-]?){13,19}/g)
    ?.map((s) => s.replace(/\D/g, ""))
    .filter((s) => s.length >= 13 && s.length <= 19 && luhn(s));

  // Scadenza MM/YY o MM-YY
  const expMatch = text.match(/\b(0[1-9]|1[0-2])\s*[/\-]\s*(\d{2}|\d{4})\b/);
  let exp: string | null = null;
  if (expMatch) {
    const mm = expMatch[1];
    const yy = expMatch[2].length === 4 ? expMatch[2].slice(-2) : expMatch[2];
    exp = `${mm}/${yy}`;
  }

  // Holder: cerca una riga in maiuscolo con almeno 2 parole (nome cognome)
  const holderLine = text
    .split(/\n/)
    .map((l) => l.trim())
    .find((l) =>
      /^[A-Z][A-Z\s.'-]{4,30}$/.test(l) &&
      l.split(/\s+/).length >= 2 &&
      !/VISA|MASTERCARD|DEBIT|CREDIT|VALID|THRU|BANK|CARD/i.test(l),
    );

  return {
    pan: panMatch?.[0] ?? null,
    exp,
    holder: holderLine ?? null,
    rawText: text,
  };
}

/** Algoritmo di Luhn per validare il PAN. */
function luhn(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/**
 * Auto-crop on-device: rileva i bordi della carta (gradiente di luminosità
 * su righe/colonne) e ritaglia l'area della carta. Ritorna una dataURL.
 */
export async function autoCropCard(dataUrl: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const lum = (x: number, y: number) => { const i = (y * w + x) * 4; return px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11; };
  const col = new Float32Array(w), row = new Float32Array(h);
  for (let y = 1; y < h - 1; y += 2) for (let x = 1; x < w - 1; x += 2) {
    const gx = Math.abs(lum(x + 1, y) - lum(x - 1, y));
    const gy = Math.abs(lum(x, y + 1) - lum(x, y - 1));
    col[x] += gx; row[y] += gy;
  }
  const edge = (a: Float32Array, from: number, to: number) => {
    let best = from, bv = -1;
    const step = from < to ? 1 : -1;
    for (let i = from; i !== to; i += step) if (a[i] > bv) { bv = a[i]; best = i; }
    return best;
  };
  const left = edge(col, 1, Math.floor(w * 0.35)), right = edge(col, w - 2, Math.floor(w * 0.65));
  const top = edge(row, 1, Math.floor(h * 0.35)), bottom = edge(row, h - 2, Math.floor(h * 0.65));
  const cw = right - left, ch = bottom - top;
  if (cw < w * 0.3 || ch < h * 0.2) return dataUrl;
  const out = document.createElement("canvas");
  out.width = cw; out.height = ch;
  out.getContext("2d")!.drawImage(c, left, top, cw, ch, 0, 0, cw, ch);
  return out.toDataURL("image/jpeg", 0.9);
}
