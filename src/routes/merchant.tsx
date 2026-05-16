import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Store, Loader2, Check, X, Clock, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/merchant")({
  component: MerchantPage,
  head: () => ({ meta: [{ title: "Merchant · FingerPay" }] }),
});

type Req = {
  id: string; status: string; token: string | null;
  amount: number; currency: string; user_email: string;
  merchant_name: string; merchant_ref: string | null;
  created_at: string; authorized_at: string | null; expires_at: string;
};

function MerchantPage() {
  const [merchantName, setMerchantName] = useState("Caffè del Centro");
  const [ref, setRef] = useState("ORD-" + Math.floor(Math.random() * 9000 + 1000));
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("12.50");
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<Req | null>(null);

  useEffect(() => {
    if (!request || request.status !== "pending") return;
    const t = setInterval(async () => {
      const { data } = await supabase.from("payment_requests").select("*").eq("id", request.id).maybeSingle();
      if (data) setRequest(data as Req);
    }, 2000);
    return () => clearInterval(t);
  }, [request]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !amount) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("payment_requests").insert({
        merchant_name: merchantName,
        merchant_ref: ref,
        user_email: email.toLowerCase().trim(),
        amount: Number(amount),
        currency: "EUR",
      }).select().single();
      if (error) throw error;
      setRequest(data as Req);
      toast.success("Richiesta inviata. In attesa dell'autorizzazione biometrica.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  }

  function reset() {
    setRequest(null);
    setRef("ORD-" + Math.floor(Math.random() * 9000 + 1000));
  }

  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <Link to="/" className="text-xs uppercase tracking-[0.3em] text-gold">FingerPay</Link>
      <div className="mt-4 flex items-center gap-3">
        <Store className="h-7 w-7 text-gold" />
        <h1 className="text-4xl font-display">Portale Merchant</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Invia una richiesta di pagamento all'utente. Riceverai un token monouso solo
        dopo l'autorizzazione biometrica sul suo dispositivo.
      </p>

      {!request ? (
        <form onSubmit={submit} className="mt-8 p-8 rounded-3xl bg-card border border-border space-y-4">
          <Field label="Nome esercente" value={merchantName} onChange={setMerchantName} />
          <Field label="Riferimento ordine" value={ref} onChange={setRef} />
          <Field label="Email cliente FingerPay" type="email" value={email} onChange={setEmail} required />
          <Field label="Importo (EUR)" type="number" value={amount} onChange={setAmount} required />
          <button disabled={loading} className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Invia richiesta
          </button>
        </form>
      ) : (
        <div className="mt-8 p-8 rounded-3xl bg-card border border-border">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Richiesta #{request.merchant_ref}</div>
          <div className="mt-2 font-display text-5xl">€ {Number(request.amount).toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">verso {request.user_email}</div>

          <div className="mt-8">
            {request.status === "pending" && (
              <div className="flex items-center gap-3 text-yellow-700">
                <Clock className="h-5 w-5 animate-pulse" /> In attesa di autorizzazione biometrica…
              </div>
            )}
            {request.status === "authorized" && (
              <div>
                <div className="flex items-center gap-3 text-emerald-700">
                  <Check className="h-5 w-5" /> Pagamento autorizzato
                </div>
                <div className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Token monouso</div>
                <div className="mt-1 p-3 rounded-xl bg-secondary font-mono text-xs break-all text-gold flex items-center justify-between gap-2">
                  <span>{request.token}</span>
                  <button onClick={() => { navigator.clipboard.writeText(request.token!); toast.success("Copiato"); }}
                    className="p-1 hover:text-foreground"><Copy className="h-3 w-3" /></button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Usa questo token con il tuo acquirer per regolare l'incasso. Il PAN della carta non transita mai dal merchant.</p>
              </div>
            )}
            {request.status === "declined" && (
              <div className="flex items-center gap-3 text-red-700"><X className="h-5 w-5" /> Pagamento rifiutato dal cliente</div>
            )}
            {request.status === "expired" && (
              <div className="flex items-center gap-3 text-muted-foreground"><Clock className="h-5 w-5" /> Richiesta scaduta</div>
            )}
          </div>

          <button onClick={reset} className="mt-8 w-full h-11 rounded-full bg-secondary text-sm">Nuova richiesta</button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="mt-1 w-full h-11 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-gold/40" />
    </label>
  );
}
