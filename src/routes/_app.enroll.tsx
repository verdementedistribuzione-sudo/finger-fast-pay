import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, AlertTriangle, Loader2, Check, Fingerprint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  isBiometricSupported,
  registerBiometric,
  verifyBiometric,
  hasCredential,
} from "@/lib/webauthn";
import { hashPin, verifyPin } from "@/lib/pin";
import { FingerprintScan } from "@/components/FingerprintScan";
import { logAudit } from "@/lib/audit";
import { SecurityGate } from "@/components/SecurityGate";
import { toast } from "sonner";
import { AccountToolbar } from "@/components/AccountToolbar";
import { EnrollStatusPanel } from "@/components/EnrollStatusPanel";
import { OpenInBrowserBanner } from "@/components/OpenInBrowserBanner";

export const Route = createFileRoute("/_app/enroll")({
  component: GatedEnroll,
  head: () => ({ meta: [{ title: "Enrollment biometrico · FingerPay" }] }),
});

function GatedEnroll() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) {
    return (
      <SecurityGate
        title="Scansione impronte"
        description="Doppio lucchetto: password + PIN, poi permessi del telefono."
        onUnlocked={() => setUnlocked(true)}
      >
        <div />
      </SecurityGate>
    );
  }
  return <EnrollPage />;
}

type ScanState = "idle" | "scanning" | "done" | "error";

function EnrollPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [scan1, setScan1] = useState<ScanState>("idle");
  const [scan2, setScan2] = useState<ScanState>("idle");
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [mode, setMode] = useState<"bio" | "fallback">("bio");
  const [deviceLabel] = useState(detectDevice());
  const [statusKey, setStatusKey] = useState(0);
  const bumpStatus = () => setStatusKey((k) => k + 1);

  useEffect(() => {
    isBiometricSupported().then((ok) => {
      setSupported(ok);
      setChecking(false);
      if (!ok) setMode("fallback");
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("pin_hash")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setHasPin(!!data?.pin_hash));
  }, [user]);

  async function captureFirst() {
    if (!user) return;
    setScan1("scanning");
    setLoading(true);
    try {
      const credId = await registerBiometric(user.id, user.email || user.id);
      await supabase.from("user_devices").insert({
        user_id: user.id,
        label: deviceLabel + " · dito 1",
        credential_id: credId,
        last_used_at: new Date().toISOString(),
      });
      setScan1("done");
      await logAudit({
        userId: user.id,
        step: "enrollment_1",
        method: "biometric",
        outcome: "success",
      });
      toast.success("Impronta 1 acquisita");
      bumpStatus();
    } catch (err) {
      setScan1("error");
      await logAudit({
        userId: user.id,
        step: "enrollment_1",
        method: "biometric",
        outcome: "failure",
        reason: (err as Error).message.slice(0, 80),
      });
      toast.error("Acquisizione fallita: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function captureSecond() {
    if (!user) return;
    setScan2("scanning");
    setLoading(true);
    try {
      // Verifica che il device possa effettivamente leggere una seconda volta.
      // Su molti telefoni l'OS gestisce più dita dietro lo stesso credential.
      const ok = await verifyBiometric(user.id);
      if (!ok) throw new Error("Verifica fallita");
      setScan2("done");
      await logAudit({
        userId: user.id,
        step: "enrollment_2",
        method: "biometric",
        outcome: "success",
      });
      toast.success("Impronta 2 confermata");
      bumpStatus();
    } catch (err) {
      setScan2("error");
      await logAudit({
        userId: user.id,
        step: "enrollment_2",
        method: "biometric",
        outcome: "failure",
        reason: (err as Error).message.slice(0, 80),
      });
      toast.error("Conferma fallita: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function savePinFallback(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (newPin.length < 4) return toast.error("Almeno 4 cifre");
    setLoading(true);
    try {
      const h = await hashPin(user.id, newPin);
      const { error } = await supabase.from("profiles").update({ pin_hash: h }).eq("id", user.id);
      if (error) throw error;
      setHasPin(true);
      setNewPin("");
      toast.success("PIN salvato come fallback SCA");
      await logAudit({
        userId: user.id,
        step: "pin",
        method: "pin",
        outcome: "success",
        reason: "fallback_enrolled",
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyPinFallback() {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("profiles").select("pin_hash").eq("id", user.id).maybeSingle();
      if (!data?.pin_hash) throw new Error("PIN non impostato");
      const ok = await verifyPin(user.id, pin, data.pin_hash);
      await logAudit({
        userId: user.id,
        step: "pin",
        method: "pin",
        outcome: ok ? "success" : "failure",
        reason: ok ? "test_ok" : "wrong_pin",
      });
      if (!ok) throw new Error("PIN errato");
      toast.success("Fallback PIN funzionante");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const bothDone = scan1 === "done" && scan2 === "done";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Enrollment biometrico</div>
          <h1 className="mt-2 text-4xl font-display">Registra e verifica le impronte</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Il template non lascia mai l'enclave hardware. Salviamo solo esito e timestamp delle scansioni.
          </p>
        </div>
        <AccountToolbar />
      </div>

      <div className="mt-6 space-y-4">
        <OpenInBrowserBanner />
        <EnrollStatusPanel refreshKey={statusKey} />
      </div>

      {/* Suggerimento esplicito per uso da telefono */}
      {supported === false && (
        <div className="mt-4 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-xs text-yellow-700 dark:text-yellow-400">
          Per scansionare l'impronta apri questa pagina <strong>dal tuo iPhone o Android</strong>:
          Safari / Chrome useranno Face ID, Touch ID o il sensore di impronte del telefono.
        </div>
      )}

      {/* Controllo compatibilità */}
      <div className="mt-8 p-5 rounded-2xl border border-border bg-card flex items-start gap-4">
        {checking ? (
          <Loader2 className="h-5 w-5 animate-spin text-gold mt-0.5" />
        ) : supported ? (
          <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="font-medium">
            {checking
              ? "Controllo compatibilità in corso…"
              : supported
              ? "Dispositivo compatibile con WebAuthn / biometria di piattaforma"
              : "Questo dispositivo non espone una biometria di sistema"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {supported
              ? "Touch ID, Face ID, impronta Android o Windows Hello disponibili."
              : "Useremo il fallback sicuro: PIN SCA + conferma dall'app autorizzata."}
          </p>
        </div>
        {supported !== null && (
          <div className="flex gap-1">
            <button
              onClick={() => setMode("bio")}
              disabled={!supported}
              className={`text-xs px-3 py-1.5 rounded-full ${
                mode === "bio"
                  ? "bg-gradient-gold text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              } disabled:opacity-40`}
            >
              Biometria
            </button>
            <button
              onClick={() => setMode("fallback")}
              className={`text-xs px-3 py-1.5 rounded-full ${
                mode === "fallback"
                  ? "bg-gradient-gold text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              Fallback
            </button>
          </div>
        )}
      </div>

      {mode === "bio" && supported && (
        <div className="mt-8 p-8 rounded-3xl bg-card border border-border">
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="text-center">
              <FingerprintScan
                state={scan1 === "error" ? "idle" : (scan1 as "idle" | "scanning" | "done")}
                label="Impronta 1 · identità"
                size={160}
              />
              {scan1 === "error" && (
                <p className="mt-2 text-xs text-red-500">Errore — riprova</p>
              )}
              <button
                onClick={captureFirst}
                disabled={loading || scan1 === "done"}
                className="mt-4 w-full h-11 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {scan1 === "done" ? (
                  <>
                    <Check className="h-4 w-4" /> Acquisita
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" /> Acquisisci impronta 1
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <FingerprintScan
                state={scan2 === "error" ? "idle" : (scan2 as "idle" | "scanning" | "done")}
                label="Impronta 2 · autorizzazione"
                size={160}
              />
              {scan2 === "error" && (
                <p className="mt-2 text-xs text-red-500">Errore — riprova</p>
              )}
              <button
                onClick={captureSecond}
                disabled={loading || scan1 !== "done" || scan2 === "done" || !hasCredential(user?.id || "")}
                className="mt-4 w-full h-11 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {scan2 === "done" ? (
                  <>
                    <Check className="h-4 w-4" /> Confermata
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" /> Conferma impronta 2
                  </>
                )}
              </button>
            </div>
          </div>

          {bothDone && (
            <div className="mt-8 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30 text-center">
              <Check className="h-6 w-6 text-emerald-600 mx-auto" />
              <p className="mt-2 text-sm">
                Entrambe le impronte sono operative. Sarai pronto per la SCA al prossimo pagamento.
              </p>
              <button
                onClick={() => navigate({ to: "/wallet" })}
                className="mt-4 px-5 py-2 rounded-full bg-gradient-gold text-primary-foreground text-sm"
              >
                Vai al wallet
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "fallback" && (
        <div className="mt-8 p-8 rounded-3xl bg-card border border-border space-y-6">
          <div className="flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-gold mt-0.5" />
            <div>
              <h2 className="font-display text-xl">Procedura di fallback sicuro</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Senza biometria di sistema, la SCA usa <strong>PIN</strong> (conoscenza) e una conferma
                dall'app autorizzata (possesso). Conforme PSD2.
              </p>
            </div>
          </div>

          {!hasPin ? (
            <form onSubmit={savePinFallback} className="space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Imposta PIN SCA (4–8 cifre)
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  maxLength={8}
                  className="mt-1 w-full h-12 px-4 rounded-xl border border-border bg-background text-center font-display text-2xl tracking-[0.5em]"
                />
              </label>
              <button
                disabled={loading}
                className="w-full h-11 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Salva PIN
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-emerald-600 inline-flex items-center gap-1">
                <Check className="h-4 w-4" /> PIN SCA già configurato
              </p>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Verifica PIN
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={8}
                  className="mt-1 w-full h-12 px-4 rounded-xl border border-border bg-background text-center font-display text-2xl tracking-[0.5em]"
                />
              </label>
              <button
                onClick={verifyPinFallback}
                disabled={loading || pin.length < 4}
                className="w-full h-11 rounded-full bg-secondary text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Testa fallback
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function detectDevice(): string {
  if (typeof navigator === "undefined") return "Dispositivo";
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  return "Browser";
}
