import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Bell, Fingerprint, Loader2, Check, X, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { hasCredential, verifyBiometric } from "@/lib/webauthn";
import { verifyPin } from "@/lib/pin";
import { toast } from "sonner";
import { PasswordInput } from "@/components/PasswordInput";

export const Route = createFileRoute("/_app/requests")({
  component: RequestsPage,
  head: () => ({ meta: [{ title: "Richieste · FingerPay" }] }),
});

type Req = {
  id: string; merchant_name: string; merchant_ref: string | null;
  amount: number; currency: string; status: string; user_email: string;
  created_at: string; expires_at: string;
};

function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Req[]>([]);
  const [threshold, setThreshold] = useState(50);
  const [requirePin, setRequirePin] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pinPromptFor, setPinPromptFor] = useState<Req | null>(null);
  const [pin, setPin] = useState("");

  const load = useCallback(async () => {
    if (!user?.email) return;
    const { data } = await supabase.from("payment_requests").select("*")
      .eq("user_email", user.email).eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    setRequests((data || []) as Req[]);
  }, [user?.email]);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) { setThreshold(Number(data.sca_threshold)); setRequirePin(data.require_pin_above_threshold); }
    });
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  async function decline(req: Req) {
    setBusyId(req.id);
    await supabase.from("payment_requests").update({ status: "declined" }).eq("id", req.id);
    toast.success("Richiesta rifiutata");
    setBusyId(null);
    load();
  }

  async function authorize(req: Req, pinValue?: string) {
    if (!user) return;
    if (!hasCredential(user.id)) { toast.error("Registra prima la biometria"); return; }
    setBusyId(req.id);
    try {
      // First finger
      await verifyBiometric(user.id);
      const aboveThreshold = Number(req.amount) > threshold;

      if (aboveThreshold) {
        // SCA: second factor required
        if (requirePin) {
          if (!pinValue) {
            setPinPromptFor(req); setBusyId(null); return;
          }
          const { data: prof } = await supabase.from("profiles").select("pin_hash").eq("id", user.id).maybeSingle();
          if (!prof?.pin_hash) throw new Error("PIN non impostato. Configuralo nelle impostazioni.");
          const ok = await verifyPin(user.id, pinValue, prof.pin_hash);
          if (!ok) throw new Error("PIN errato");
        } else {
          // second finger
          await verifyBiometric(user.id);
        }
      }

      const token = "fp_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      const { error } = await supabase.from("payment_requests").update({
        status: "authorized", token, user_id: user.id, authorized_at: new Date().toISOString(),
      }).eq("id", req.id);
      if (error) throw error;

      await supabase.from("transactions").insert({
        user_id: user.id, amount: req.amount, currency: req.currency,
        status: "authorized", token, merchant: req.merchant_name,
      });

      toast.success("Pagamento autorizzato");
      setPinPromptFor(null); setPin("");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusyId(null); }
  }

  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.3em] text-gold">Notifiche merchant</div>
      <h1 className="mt-2 text-4xl font-display flex items-center gap-3">
        <Bell className="h-7 w-7 text-gold" /> Richieste in attesa
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sopra <strong>€ {threshold.toFixed(2)}</strong> serve {requirePin ? "PIN" : "secondo dito"} come Strong Customer Authentication.
      </p>

      {requests.length === 0 ? (
        <div className="mt-10 p-12 rounded-3xl bg-card border border-border text-center text-muted-foreground">
          Nessuna richiesta in attesa.
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {requests.map((r) => (
            <li key={r.id} className="p-6 rounded-3xl bg-card border border-border">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{r.merchant_ref}</div>
                  <div className="mt-1 font-display text-2xl">{r.merchant_name}</div>
                  <div className="mt-2 font-display text-4xl">€ {Number(r.amount).toFixed(2)}</div>
                </div>
                {Number(r.amount) > threshold && (
                  <span className="px-2 py-1 text-[10px] uppercase tracking-widest rounded-full bg-gold/10 text-gold border border-gold/30">SCA</span>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => authorize(r)} disabled={busyId === r.id}
                  className="flex-1 h-11 rounded-full bg-gradient-gold text-primary-foreground font-medium inline-flex items-center justify-center gap-2">
                  {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                  Autorizza
                </button>
                <button onClick={() => decline(r)} disabled={busyId === r.id}
                  className="h-11 px-5 rounded-full bg-secondary text-sm inline-flex items-center gap-2">
                  <X className="h-4 w-4" /> Rifiuta
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pinPromptFor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full border border-border">
            <KeyRound className="h-8 w-8 text-gold" />
            <h2 className="mt-3 text-2xl font-display">Conferma con PIN</h2>
            <p className="mt-1 text-sm text-muted-foreground">Importo sopra soglia: SCA richiesta.</p>
            <PasswordInput inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)}
              placeholder="••••" maxLength={8}
              className="mt-6 w-full h-14 px-4 rounded-xl border border-border bg-background text-center font-display text-2xl tracking-[0.5em]" />
            <div className="mt-4 flex gap-3">
              <button onClick={() => { setPinPromptFor(null); setPin(""); }}
                className="flex-1 h-11 rounded-full bg-secondary text-sm">Annulla</button>
              <button onClick={() => authorize(pinPromptFor, pin)}
                className="flex-1 h-11 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium">
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
