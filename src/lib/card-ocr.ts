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
