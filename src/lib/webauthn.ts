// Lightweight WebAuthn helpers. We use the platform authenticator (Touch ID,
// Face ID, Android Biometric, Windows Hello) for "two-finger" style biometric
// verification. The biometric template never leaves the device — only a
// cryptographic assertion is produced.

const STORAGE_KEY = "fp_webauthn_credentials";

type StoredCred = { userId: string; credentialId: string };

function loadAll(): StoredCred[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAll(creds: StoredCred[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export function hasCredential(userId: string) {
  return loadAll().some((c) => c.userId === userId);
}

export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function bufToB64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64ToBuf(b64: string) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

export async function registerBiometric(userId: string, userName: string) {
  if (!(await isBiometricSupported())) {
    throw new Error("Il dispositivo non supporta la biometria del sistema");
  }
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userIdBytes = new TextEncoder().encode(userId);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "FingerPay" },
      user: { id: userIdBytes, name: userName, displayName: userName },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Registrazione biometrica annullata");

  const credentialId = bufToB64(credential.rawId);
  const all = loadAll().filter((c) => c.userId !== userId);
  all.push({ userId, credentialId });
  saveAll(all);
  return credentialId;
}

export async function verifyBiometric(userId: string): Promise<boolean> {
  const cred = loadAll().find((c) => c.userId === userId);
  if (!cred) throw new Error("Nessuna credenziale biometrica registrata");

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ id: b64ToBuf(cred.credentialId), type: "public-key" }],
      userVerification: "required",
      timeout: 60000,
    },
  });
  return !!assertion;
}

export function removeCredential(userId: string) {
  saveAll(loadAll().filter((c) => c.userId !== userId));
}
