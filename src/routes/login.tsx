import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Fingerprint, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { hasCredential, isBiometricSupported, verifyBiometric } from "@/lib/webauthn";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Accedi · FingerPay" }] }),
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [bioReady, setBioReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supported = await isBiometricSupported();
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (uid) {
        setSessionUserId(uid);
        setEmail(data.session!.user.email || "");
      }
      setBioReady(supported && !!uid && hasCredential(uid));
    })();
  }, []);

  async function biometricUnlock() {
    if (!sessionUserId) return;
    setLoading(true);
    try {
      await verifyBiometric(sessionUserId);
      toast.success("Identità verificata");
      navigate({ to: "/wallet" });
    } catch (err) {
      toast.error("Verifica fallita: " + (err as Error).message);
    } finally { setLoading(false); }
  }

  async function passwordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const uid = data.user.id;
      if (hasCredential(uid)) {
        try { await verifyBiometric(uid); toast.success("Identità confermata"); }
        catch { toast.warning("Biometria non confermata"); }
      }
      navigate({ to: "/wallet" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  }

  async function sendOtp() {
    if (!email) return toast.error("Inserisci la tua email");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email, options: { emailRedirectTo: window.location.origin + "/wallet" },
      });
      if (error) throw error;
      toast.success("Link di ripristino inviato via email");
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-gold">FingerPay</Link>
        <h1 className="mt-4 text-4xl font-display">Bentornato</h1>
        <p className="mt-2 text-sm text-muted-foreground">Accedi senza password con la tua biometria.</p>

        {bioReady && (
          <div className="mt-8 p-8 rounded-3xl bg-card border border-gold/30 text-center">
            <Fingerprint className="h-14 w-14 text-gold mx-auto" />
            <div className="mt-4 text-sm">Sblocca <strong>{email}</strong></div>
            <button onClick={biometricUnlock} disabled={loading}
              className="mt-6 w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
              Accedi con biometria
            </button>
            <button onClick={() => setBioReady(false)} className="mt-3 text-xs text-muted-foreground hover:text-foreground">
              Usa password
            </button>
          </div>
        )}

        {!bioReady && (
          <>
            <form onSubmit={passwordLogin} className="mt-8 space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="mt-1 w-full h-11 px-4 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-gold/40" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Password</span>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="mt-1 w-full h-11 px-4 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-gold/40" />
              </label>
              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                Accedi
              </button>
            </form>
            <div className="mt-6 text-center text-xs text-muted-foreground">— ripristino sicuro —</div>
            <button onClick={sendOtp} disabled={loading}
              className="mt-3 w-full h-11 rounded-full bg-secondary text-sm inline-flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" /> Invia link via email
            </button>
            <p className="mt-6 text-sm text-muted-foreground text-center">
              Non hai un account? <Link to="/register" className="text-gold">Registrati</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
