import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordInput } from "@/components/PasswordInput";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({ meta: [{ title: "Nuova password · FingerPay" }] }),
});

/**
 * Pagina di atterraggio del link "ripristina password" inviato da Supabase.
 * Il client legge il token dall'URL e apre una sessione di recupero;
 * qui l'utente sceglie la nuova password.
 */
function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const err = hash.get("error_description") || query.get("error_description");
    if (err) {
      setLinkError(err.replace(/\+/g, " "));
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) setReady(true);
    });
    (async () => {
      const code = query.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return setLinkError(error.message);
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) setReady(true);
    })();
    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("La password deve avere almeno 8 caratteri");
    if (password !== confirm) return toast.error("Le password non coincidono");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password aggiornata");
      navigate({ to: "/wallet" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  }

  const inputClass = "mt-1 w-full h-11 px-4 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-gold/40";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-gold">FingerPay</Link>
        <h1 className="mt-4 text-4xl font-display">Nuova password</h1>

        {linkError ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-red-500">Il link non è valido o è scaduto: {linkError}</p>
            <Link to="/login" className="text-gold text-sm">Richiedi un nuovo link</Link>
          </div>
        ) : !ready ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifica del link in corso…
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Nuova password</span>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className={inputClass} />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Conferma password</span>
              <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" className={inputClass} />
            </label>
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Salva password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
