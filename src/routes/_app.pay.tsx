import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Fingerprint, Loader2, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { hasCredential, isBiometricSupported, verifyBiometric } from "@/lib/webauthn";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pay")({
  component: PayPage,
  head: () => ({ meta: [{ title: "Paga · FingerPay" }] }),
});

type Card = { id: string; brand: string; last4: string };

type Step = "form" | "first" | "second" | "done";

function PayPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("FingerPay Demo Store");
  const [cardId, setCardId] = useState<string>("");
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    isBiometricSupported().then(setBioSupported);
    supabase.from("payment_cards").select("id,brand,last4").then(({ data }) => {
      const cs = (data || []) as Card[];
      setCards(cs);
      if (cs[0]) setCardId(cs[0].id);
    });
  }, []);

  async function startFlow(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error("Inserisci un importo");
    if (!cardId) return toast.error("Seleziona una carta");
    setStep("first");
  }

  async function firstFinger() {
    if (!user) return;
    if (!hasCredential(user.id)) {
      toast.error("Registra prima la biometria dal tuo profilo");
      return;
    }
    setLoading(true);
    try {
      await verifyBiometric(user.id);
      toast.success("Primo dito: identità sbloccata");
      setStep("second");
    } catch (err) {
      toast.error("Verifica fallita: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function secondFinger() {
    if (!user) return;
    setLoading(true);
    try {
      await verifyBiometric(user.id);
      const tok = "fp_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        card_id: cardId,
        amount: Number(amount),
        currency: "EUR",
        status: "authorized",
        token: tok,
        merchant,
      });
      if (error) throw error;
      setToken(tok);
      setStep("done");
      toast.success("Pagamento autorizzato");
    } catch (err) {
      toast.error("Autorizzazione fallita: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setAmount(""); setStep("form"); setToken(null);
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <AlertCircle className="h-10 w-10 text-gold mx-auto" />
        <h1 className="mt-4 text-2xl font-display">Nessuna carta nel wallet</h1>
        <p className="mt-2 text-sm text-muted-foreground">Aggiungi una carta per poter pagare.</p>
        <Link to="/cards" className="mt-6 inline-block px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium">
          Aggiungi carta
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-xs uppercase tracking-[0.3em] text-gold">Pagamento a due dita</div>
      <h1 className="mt-2 text-4xl font-display">Autorizza con la biometria</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Primo dito: sblocca la lista carte. Secondo dito: autorizza il pagamento e genera il token monouso.
      </p>

      {!bioSupported && (
        <div className="mt-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-sm text-yellow-700">
          Il tuo dispositivo non espone una biometria di sistema. Su iOS/Android funziona nativamente.
        </div>
      )}

      <div className="mt-8 p-8 rounded-3xl bg-card border border-border">
        {step === "form" && (
          <form onSubmit={startFlow} className="space-y-5">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Importo</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-display text-4xl text-muted-foreground">€</span>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00" className="flex-1 h-16 px-2 bg-transparent font-display text-5xl focus:outline-none" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Merchant</span>
              <input value={merchant} onChange={(e) => setMerchant(e.target.value)}
                className="mt-1 w-full h-11 px-4 rounded-xl border border-border bg-background" />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Carta</span>
              <select value={cardId} onChange={(e) => setCardId(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-xl border border-border bg-background">
                {cards.map((c) => <option key={c.id} value={c.id}>{c.brand} •••• {c.last4}</option>)}
              </select>
            </label>
            <button className="w-full h-14 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center justify-center gap-2">
              <Fingerprint className="h-5 w-5" /> Procedi
            </button>
          </form>
        )}

        {(step === "first" || step === "second") && (
          <div className="text-center py-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {step === "first" ? "Passo 1 di 2 — Sblocca identità" : "Passo 2 di 2 — Autorizza pagamento"}
            </div>
            <button
              onClick={step === "first" ? firstFinger : secondFinger}
              disabled={loading}
              className="mt-8 mx-auto h-32 w-32 rounded-full bg-gradient-gold/10 border-2 border-gold flex items-center justify-center hover:scale-105 transition active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="h-10 w-10 text-gold animate-spin" /> : <Fingerprint className="h-14 w-14 text-gold" />}
            </button>
            <div className="mt-6 font-display text-3xl">€ {Number(amount).toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">{merchant}</div>
            <p className="mt-6 text-xs text-muted-foreground">
              {step === "first" ? "Tocca il sensore del tuo dispositivo con il primo dito." : "Tocca di nuovo con il secondo dito per confermare."}
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="mt-6 text-3xl font-display">Pagamento autorizzato</h2>
            <div className="mt-4 font-display text-4xl">€ {Number(amount).toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">verso {merchant}</div>
            <div className="mt-6 p-3 rounded-xl bg-secondary font-mono text-xs break-all text-gold">{token}</div>
            <p className="mt-2 text-xs text-muted-foreground">Token monouso inviato al merchant. Il PAN della carta non è mai stato condiviso.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={reset} className="px-5 py-2.5 rounded-full bg-secondary text-sm">Nuovo pagamento</button>
              <Link to="/wallet" className="px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium">Vai al wallet</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
