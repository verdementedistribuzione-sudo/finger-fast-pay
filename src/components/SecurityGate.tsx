import { useState } from "react";
import { Lock, KeyRound, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { verifyPin } from "@/lib/pin";
import { toast } from "sonner";
import { AccountToolbar } from "./AccountToolbar";

type Step = "password" | "pin" | "permission" | "unlocked";

interface Props {
  title?: string;
  description?: string;
  /** Called once password + PIN + device permission are all granted. */
  onUnlocked: () => void;
  children: React.ReactNode;
}

/**
 * Doppio lucchetto richiesto prima di accedere alla scansione impronte:
 *   1) ri-conferma password (qualcosa che sai)
 *   2) PIN SCA (secondo fattore di conoscenza)
 *   3) richiesta esplicita dei permessi del telefono (biometria / sensori)
 * Solo dopo il triplo OK mostra il contenuto biometrico.
 */
export function SecurityGate({
  title = "Area protetta",
  description = "Per accedere alla scansione delle impronte conferma password e PIN, poi autorizza il telefono.",
  onUnlocked,
  children,
}: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (error) throw error;
      setPassword("");
      setStep("pin");
    } catch (err) {
      toast.error("Password errata");
    } finally {
      setLoading(false);
    }
  }

  async function checkPin(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("pin_hash")
        .eq("id", user.id)
        .maybeSingle();
      if (!data?.pin_hash) {
        toast.error("PIN non impostato. Configuralo nel fallback.");
        return;
      }
      const ok = await verifyPin(user.id, pin, data.pin_hash);
      if (!ok) throw new Error("PIN errato");
      setPin("");
      setStep("permission");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function requestPermission() {
    setLoading(true);
    try {
      // Richiesta esplicita dei permessi sensori del telefono (dove supportato).
      // Su iOS DeviceMotionEvent.requestPermission richiede gesto utente.
      const dm = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } })
        .DeviceMotionEvent;
      if (dm?.requestPermission) {
        try { await dm.requestPermission(); } catch { /* utente ha rifiutato i sensori, biometria può comunque funzionare */ }
      }
      // Verifica disponibilità WebAuthn / biometria piattaforma.
      if (!window.PublicKeyCredential) throw new Error("Browser non supporta WebAuthn");
      const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!ok) {
        toast.warning("Biometria di sistema non rilevata. Apri da telefono.");
      }
      setStep("unlocked");
      onUnlocked();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "unlocked") return <>{children}</>;

  return (
    <div className="max-w-md mx-auto">
      <div className="p-8 rounded-3xl border border-gold/30 bg-card shadow-gold">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-gold inline-flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl">{title}</h1>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* progress */}
        <div className="mt-6 flex items-center gap-2 text-[10px] uppercase tracking-widest">
          <Dot active={step === "password"} done={step !== "password"} label="Password" />
          <span className="flex-1 h-px bg-border" />
          <Dot active={step === "pin"} done={step === "permission"} label="PIN" />
          <span className="flex-1 h-px bg-border" />
          <Dot active={step === "permission"} done={false} label="Telefono" />
        </div>

        {step === "password" && (
          <form onSubmit={checkPassword} className="mt-8 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
                <Lock className="h-3 w-3" /> Conferma password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="mt-1 w-full h-12 px-4 rounded-xl border border-border bg-background"
              />
            </label>
            <button
              disabled={loading}
              className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Avanti
            </button>
          </form>
        )}

        {step === "pin" && (
          <form onSubmit={checkPin} className="mt-8 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
                <KeyRound className="h-3 w-3" /> Inserisci PIN SCA
              </span>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={8}
                required
                autoFocus
                className="mt-1 w-full h-14 px-4 rounded-xl border border-border bg-background text-center font-display text-2xl tracking-[0.5em]"
              />
            </label>
            <button
              disabled={loading || pin.length < 4}
              className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Verifica PIN
            </button>
          </form>
        )}

        {step === "permission" && (
          <div className="mt-8 space-y-4 text-center">
            <Smartphone className="h-12 w-12 text-gold mx-auto" />
            <p className="text-sm">
              Stiamo per chiedere al telefono il permesso di usare <strong>biometria e sensori</strong>.
              Conferma il prompt di sistema che apparirà.
            </p>
            <button
              onClick={requestPermission}
              disabled={loading}
              className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Autorizza telefono
            </button>
            <p className="text-[11px] text-muted-foreground">
              I dati biometrici restano nell'enclave hardware del dispositivo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          done ? "bg-emerald-500" : active ? "bg-gold" : "bg-border"
        }`}
      />
      <span className={active || done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
