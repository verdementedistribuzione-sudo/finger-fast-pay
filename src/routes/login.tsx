import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { hasCredential, verifyBiometric } from "@/lib/webauthn";
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const uid = data.user.id;
      if (hasCredential(uid)) {
        try {
          await verifyBiometric(uid);
          toast.success("Identità confermata");
        } catch {
          toast.warning("Biometria non confermata — accesso solo con password");
        }
      }
      navigate({ to: "/wallet" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-gold">FingerPay</Link>
        <h1 className="mt-4 text-4xl font-display">Bentornato</h1>
        <p className="mt-2 text-sm text-muted-foreground">Accedi al tuo wallet.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 w-full h-11 px-4 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-gold/40" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1 w-full h-11 px-4 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-gold/40" />
          </label>
          <button type="submit" disabled={loading}
            className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
            Accedi
          </button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Non hai un account? <Link to="/register" className="text-gold">Registrati</Link>
        </p>
      </div>
    </div>
  );
}
