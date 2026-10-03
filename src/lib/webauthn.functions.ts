import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

function rpFromRequest() {
  const origin = getRequestHeader("origin") || `https://${getRequestHeader("host")}`;
  const rpID = new URL(origin).hostname;
  return { origin, rpID };
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function takeChallenge(userId: string, kind: string) {
  const db = await admin();
  const { data } = await db
    .from("webauthn_challenges")
    .select("id, challenge, expires_at")
    .eq("user_id", userId)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  // monouso: cancella tutte le challenge di quel tipo (anti-replay)
  await db.from("webauthn_challenges").delete().eq("user_id", userId).eq("kind", kind);
  if (!data || new Date(data.expires_at) < new Date()) throw new Error("Challenge scaduta, riprova");
  return data.challenge;
}

export const webauthnRegisterOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userName: string }) => ({ userName: String(d.userName).slice(0, 120) }))
  .handler(async ({ data, context }) => {
    const { rpID } = rpFromRequest();
    const db = await admin();
    const { data: existing } = await db
      .from("webauthn_credentials").select("credential_id, transports").eq("user_id", context.userId);
    const options = await generateRegistrationOptions({
      rpName: "FingerPay",
      rpID,
      userName: data.userName,
      userID: new TextEncoder().encode(context.userId),
      attestationType: "direct",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      excludeCredentials: (existing ?? []).map((c) => ({ id: c.credential_id })),
    });
    await db.from("webauthn_challenges").insert({ user_id: context.userId, challenge: options.challenge, kind: "reg" });
    return JSON.parse(JSON.stringify(options));
  });

export const webauthnRegisterVerify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { response: unknown }) => d)
  .handler(async ({ data, context }) => {
    const { origin, rpID } = rpFromRequest();
    const expectedChallenge = await takeChallenge(context.userId, "reg");
    const v = await verifyRegistrationResponse({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response: data.response as any,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!v.verified || !v.registrationInfo) throw new Error("Attestation non valida");
    const info = v.registrationInfo;
    const db = await admin();
    const credentialId = info.credential.id;
    await db.from("webauthn_credentials").insert({
      user_id: context.userId,
      credential_id: credentialId,
      public_key: Buffer.from(info.credential.publicKey).toString("base64"),
      counter: info.credential.counter,
      transports: (data.response as { response?: { transports?: string[] } })?.response?.transports ?? null,
      attestation_fmt: info.fmt,
      aaguid: info.aaguid,
      device_type: info.credentialDeviceType,
      backed_up: info.credentialBackedUp,
    });
    return { credentialId, fmt: info.fmt, hardwareAttested: info.fmt !== "none" };
  });

export const webauthnAuthOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { rpID } = rpFromRequest();
    const db = await admin();
    const { data: creds } = await db
      .from("webauthn_credentials").select("credential_id").eq("user_id", context.userId);
    if (!creds?.length) throw new Error("Nessuna credenziale biometrica verificata: rifai l'enrollment");
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
      allowCredentials: creds.map((c) => ({ id: c.credential_id })),
    });
    await db.from("webauthn_challenges").insert({ user_id: context.userId, challenge: options.challenge, kind: "auth" });
    return JSON.parse(JSON.stringify(options));
  });

export const webauthnAuthVerify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { response: { id: string } }) => d)
  .handler(async ({ data, context }) => {
    const { origin, rpID } = rpFromRequest();
    const expectedChallenge = await takeChallenge(context.userId, "auth");
    const db = await admin();
    const { data: cred } = await db
      .from("webauthn_credentials").select("*")
      .eq("user_id", context.userId).eq("credential_id", data.response.id).maybeSingle();
    if (!cred) throw new Error("Credenziale sconosciuta");
    const v = await verifyAuthenticationResponse({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response: data.response as any,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: cred.credential_id,
        publicKey: new Uint8Array(Buffer.from(cred.public_key, "base64")),
        counter: Number(cred.counter),
      },
    });
    if (!v.verified) throw new Error("Firma biometrica non valida");
    const now = new Date().toISOString();
    await db.from("webauthn_credentials")
      .update({ counter: v.authenticationInfo.newCounter, last_used_at: now }).eq("id", cred.id);
    await db.from("user_devices").update({ last_used_at: now })
      .eq("user_id", context.userId).eq("credential_id", cred.credential_id);
    return { verified: true };
  });
