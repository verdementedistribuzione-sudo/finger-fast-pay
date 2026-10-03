// WebAuthn con verifica lato server: il telefono (Touch ID, Face ID,
// Android Biometric, Windows Hello) firma una challenge monouso generata dal
// server; il server verifica attestation e firma con la chiave pubblica.
// Il template biometrico non lascia mai il dispositivo.

import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { supabase } from "@/integrations/supabase/client";
import {
  webauthnRegisterOptions,
  webauthnRegisterVerify,
  webauthnAuthOptions,
  webauthnAuthVerify,
} from "./webauthn.functions";

const STORAGE_KEY = "fp_webauthn_credentials";
type StoredCred = { userId: string; credentialId: string };

function loadAll(): StoredCred[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveAll(creds: StoredCred[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

/** Cache locale (solo UI rapida). La verità è sul server. */
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

export async function getEnrollStatus(userId: string): Promise<EnrollStatus> {
  const supported = await isBiometricSupported();
  const registeredOnDevice = hasCredential(userId);
  let registeredInDb = false, devicesInDb = 0, lastUsedAt: string | null = null;
  try {
    const { data } = await supabase
      .from("webauthn_credentials")
      .select("credential_id, last_used_at")
      .eq("user_id", userId)
      .order("last_used_at", { ascending: false, nullsFirst: false });
    devicesInDb = data?.length ?? 0;
    registeredInDb = devicesInDb > 0;
    lastUsedAt = data?.[0]?.last_used_at ?? null;
  } catch { /* ignore */ }
  return { supported, registeredOnDevice, registeredInDb, devicesInDb, lastUsedAt };
}

export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch { return false; }
}

export async function registerBiometric(userId: string, userName: string) {
  if (!(await isBiometricSupported())) throw new Error("Il dispositivo non supporta la biometria del sistema");
  const optionsJSON = await webauthnRegisterOptions({ data: { userName } });
  const response = await startRegistration({ optionsJSON });
  const res = await webauthnRegisterVerify({ data: { response } });
  const all = loadAll().filter((c) => c.userId !== userId);
  all.push({ userId, credentialId: res.credentialId });
  saveAll(all);
  return res.credentialId;
}

export async function verifyBiometric(userId: string): Promise<boolean> {
  const optionsJSON = await webauthnAuthOptions();
  const response = await startAuthentication({ optionsJSON });
  const res = await webauthnAuthVerify({ data: { response } });
  if (res.verified && !hasCredential(userId)) {
    saveAll([...loadAll(), { userId, credentialId: response.id }]);
  }
  return res.verified;
}

export function removeCredential(userId: string) {
  saveAll(loadAll().filter((c) => c.userId !== userId));
}
