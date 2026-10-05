/**
 * Wallet locale cifrato: AES-GCM 256 con chiave derivata dalla password
 * (PBKDF2-SHA256, 310k iterazioni). I dati restano su questo dispositivo
 * (localStorage) e sono leggibili offline dopo lo sblocco con password.
 */
const PREFIX = "fp-vault:";
const ITER = 310_000;
let sessionKey: CryptoKey | null = null;
let sessionUser: string | null = null;

const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITER, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"],
  );
}

function saltFor(userId: string): Uint8Array {
  const k = PREFIX + userId + ":salt";
  const s = localStorage.getItem(k);
  if (s) return unb64(s);
  const n = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(k, b64(n));
  return n;
}

export function isVaultUnlocked(userId: string) {
  return !!sessionKey && sessionUser === userId;
}

/** Sblocca il vault. Se esistono già dati, verifica la password decifrandoli. */
export async function unlockVault(userId: string, password: string) {
  const key = await deriveKey(password, saltFor(userId));
  const check = localStorage.getItem(PREFIX + userId + ":check");
  if (check) {
    const [iv, ct] = check.split(".");
    try {
      await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(ct));
    } catch {
      throw new Error("Password errata");
    }
  } else {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode("ok"));
    localStorage.setItem(PREFIX + userId + ":check", b64(iv) + "." + b64(ct));
  }
  sessionKey = key;
  sessionUser = userId;
}

export function lockVault() {
  sessionKey = null;
  sessionUser = null;
}

export async function vaultSet(userId: string, name: string, value: unknown) {
  if (!isVaultUnlocked(userId)) return;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sessionKey!, new TextEncoder().encode(JSON.stringify(value)));
  localStorage.setItem(PREFIX + userId + ":" + name, b64(iv) + "." + b64(ct));
}

export async function vaultGet<T>(userId: string, name: string): Promise<T | null> {
  if (!isVaultUnlocked(userId)) return null;
  const raw = localStorage.getItem(PREFIX + userId + ":" + name);
  if (!raw) return null;
  const [iv, ct] = raw.split(".");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, sessionKey!, unb64(ct));
  return JSON.parse(new TextDecoder().decode(pt)) as T;
}
