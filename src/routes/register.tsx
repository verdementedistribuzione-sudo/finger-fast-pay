import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Fingerprint, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isBiometricSupported, registerBiometric } from "@/lib/webauthn";
import { hashPin } from "@/lib/pin";
import { toast } from "sonner";
import { PasswordInput } from "@/components/PasswordInput";

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({ meta: [{ title: "Registrati · FingerPay" }] }),
});

function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [deviceLabel, setDeviceLabel] = useState(detectDevice());
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "biometric">("form");
  const [userId, setUserId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4) return toast.error("Il PIN deve avere almeno 4 cifre");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: window.location.origin + "/wallet",
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Registrazione fallita");
      setUserId(data.user.id);

      // Store PIN hash + default user role
      const pinHash = await hashPin(data.user.id, pin);
      await supabase.from("profiles").update({ pin_hash: pinHash }).eq("id", data.user.id);

      const supported = await isBiometricSupported();
      if (supported) setStep("biometric");
      else { toast.success("Account creato"); navigate({ to: "/wallet" }); }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  }

  async function enrollBiometric() {
    if (!userId) return;
    setLoading(true);
    try {
      const credId = await registerBiometric(userId, email);
      await supabase.from("user_devices").insert({
        user_id: userId, label: deviceLabel, credential_id: credId, last_used_at: new Date().toISOString(),
      });
      toast.success("Biometria registrata");
      navigate({ to: "/wallet" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-gold">FingerPay</Link>

        {step === "form" ? (
          <>
            <h1 className="mt-4 text-4xl font-display">Crea il tuo account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Email + PIN come fattore di possesso/conoscenza, biometria del device come inherence.
            </p>
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <Field label="Nome completo" value={fullName} onChange={setFullName} required />
              <Field label="Email" type="email" value={email} onChange={setEmail} required />
              <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={8} />
              <Field label="PIN SCA (4–8 cifre)" type="password" inputMode="numeric" value={pin} onChange={setPin} required minLength={4} maxLength={8} />
              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Crea account
              </button>
            </form>
            <p className="mt-6 text-sm text-muted-foreground text-center">
              Hai già un account? <Link to="/login" className="text-gold">Accedi</Link>
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-gradient-gold/10 flex items-center justify-center border border-gold/30">
              <Fingerprint className="h-12 w-12 text-gold" />
            </div>
            <h1 className="mt-6 text-3xl font-display">Registra l'impronta</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Touch ID, Face ID, impronta Android o Windows Hello. Il template biometrico non lascia mai il dispositivo.
            </p>
            <div className="mt-6 text-left">
              <Field label="Nome dispositivo" value={deviceLabel} onChange={setDeviceLabel} />
            </div>
            <button onClick={enrollBiometric} disabled={loading}
              className="mt-6 w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}Attiva biometria
            </button>
            <button onClick={() => navigate({ to: "/wallet" })} className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground">Salta per ora</button>
            <p className="mt-6 text-xs text-muted-foreground inline-flex items-center gap-1 justify-center">
              <ShieldCheck className="h-3 w-3" /> Cancellable biometrics · <KeyRound className="h-3 w-3 ml-1" /> PIN SCA
            </p>
          </div>
        )}
      </div>
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

function Field({ label, value, onChange, type = "text", required, minLength, maxLength, inputMode }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
  required?: boolean; minLength?: number; maxLength?: number; inputMode?: "numeric" | "text";
}) {
  const cls = "mt-1 w-full h-11 px-4 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-gold/40";
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {type === "password" ? (
        <PasswordInput value={value} onChange={(e) => onChange(e.target.value)} required={required}
          minLength={minLength} maxLength={maxLength} inputMode={inputMode} className={cls} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
          minLength={minLength} maxLength={maxLength} inputMode={inputMode} className={cls} />
      )}
    </label>
  );
}
