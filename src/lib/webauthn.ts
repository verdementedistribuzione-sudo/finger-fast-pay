// Lightweight WebAuthn helpers. We use the platform authenticator (Touch ID,
// Face ID, Android Biometric, Windows Hello) for "two-finger" style biometric
// verification. The biometric template never leaves the device — only a
// cryptographic assertion is produced.

import { supabase } from "@/integrations/supabase/client";

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

/** Sincrono — utile per UI rapide. Riflette solo cache locale del device. */
export function hasCredential(userId: string) {
  return loadAll().some((c) => c.userId === userId);
}

export type EnrollStatus = {
  supported: boolean;
  registeredOnDevice: boolean;
  registeredInDb: boolean;
  devicesInDb: number;
  lastUsedAt: string | null;
};

/** Verifica autoritativa: combina supporto WebAuthn + DB user_devices. */
export async function getEnrollStatus(userId: string): Promise<EnrollStatus> {
  const supported = await isBiometricSupported();
  const registeredOnDevice = hasCredential(userId);
  let registeredInDb = false;
  let devicesInDb = 0;
  let lastUsedAt: string | null = null;
  try {
    const { data } = await supabase
      .from("user_devices")
      .select("credential_id, last_used_at")
      .eq("user_id", userId)
      .order("last_used_at", { ascending: false, nullsFirst: false });
    devicesInDb = data?.length ?? 0;
    registeredInDb = (data ?? []).some((d) => !!d.credential_id);
    lastUsedAt = data?.[0]?.last_used_at ?? null;
  } catch {
    /* offline / RLS: lascia falsi */
  }
  return { supported, registeredOnDevice, registeredInDb, devicesInDb, lastUsedAt };
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

  const rpId = typeof window !== "undefined" ? window.location.hostname : undefined;
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: rpId ? { name: "FingerPay", id: rpId } : { name: "FingerPay" },
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
      // "none" funziona su tutti i telefoni (iOS/Android) senza richiedere
      // catene di attestazione che alcuni browser mobile bloccano.
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
  const rpId = typeof window !== "undefined" ? window.location.hostname : undefined;
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      ...(rpId ? { rpId } : {}),
      allowCredentials: [{ id: b64ToBuf(cred.credentialId), type: "public-key" }],
      userVerification: "required",
      timeout: 60000,
    },
  });
  if (assertion) {
    // Prova che il sensore biometrico è stato effettivamente toccato:
    // marchiamo last_used_at nel DB. Se RLS blocca, ignoriamo.
    try {
      await supabase
        .from("user_devices")
        .update({ last_used_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("credential_id", cred.credentialId);
    } catch { /* non-fatal */ }
  }
  return !!assertion;
}

export function removeCredential(userId: string) {
  saveAll(loadAll().filter((c) => c.userId !== userId));
}
