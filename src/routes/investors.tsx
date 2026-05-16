import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Fingerprint } from "lucide-react";

export const Route = createFileRoute("/investors")({
  component: Investors,
  head: () => ({ meta: [
    { title: "Investor Pitch · FingerPay" },
    { name: "description", content: "Business model, mercato indirizzabile, modello di ricavi e pitch per investitori FingerPay." },
  ]}),
});

function Investors() {
  return (
    <div className="min-h-screen">
      <SiteNav />

      <section className="pt-32 pb-16 mx-auto max-w-5xl px-6 text-center">
        <Fingerprint className="h-16 w-16 text-gold mx-auto" strokeWidth={1} />
        <div className="mt-6 text-xs uppercase tracking-[0.3em] text-gold">Investor Pitch</div>
        <h1 className="mt-4 text-5xl md:text-7xl">Il pagamento<br /><span className="text-gradient-gold italic">dopo la carta.</span></h1>
        <p className="mt-8 max-w-2xl mx-auto text-lg text-muted-foreground">
          Apple Pay ha digitalizzato la carta. FingerPay la elimina.
          Una sola identità biometrica per pagare, viaggiare, identificarsi.
          Token monouso, zero PII al merchant, conforme PSD2 e GDPR.
        </p>
      </section>

      {/* Problem / Solution */}
      <section className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-2 gap-6">
        <div className="p-8 rounded-2xl glass">
          <div className="text-xs uppercase tracking-widest text-red-400/80">Problema</div>
          <h3 className="mt-3 font-display text-3xl">Frizione e dati esposti</h3>
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            <li>· Card-not-present frodi: €1,9B in Europa nel 2024</li>
            <li>· 6+ wallet diversi per pagare, viaggiare, accedere</li>
            <li>· Merchant ricevono PAN, indirizzi, email → rischio breach</li>
            <li>· Smartphone scarico = identità persa</li>
          </ul>
        </div>
        <div className="p-8 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
          <div className="text-xs uppercase tracking-widest text-gold">Soluzione</div>
          <h3 className="mt-3 font-display text-3xl">Il dito è la chiave universale</h3>
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            <li>· Una sola identità biometrica anonima</li>
            <li>· Token monouso scopato per merchant e servizio</li>
            <li>· Merchant non vede mai carta, nome o email</li>
            <li>· Funziona senza smartphone, senza carta, senza password</li>
          </ul>
        </div>
      </section>

      {/* Market */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl">Mercato</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            { k: "TAM", v: "€ 2,3 T", d: "Pagamenti POS globali 2027" },
            { k: "SAM", v: "€ 410 B", d: "EU + UK + Asia avanzata" },
            { k: "SOM 5y", v: "€ 1,8 B", d: "0,4% pen. su retail premium" },
          ].map((m) => (
            <div key={m.k} className="p-8 rounded-2xl glass">
              <div className="text-xs uppercase tracking-widest text-gold">{m.k}</div>
              <div className="mt-3 font-display text-5xl text-gradient-gold">{m.v}</div>
              <div className="mt-2 text-sm text-muted-foreground">{m.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Business model */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl">Business model</h2>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["Interchange share", "0,15% per transazione pagamento"],
            ["SaaS merchant", "€ 39 / mese per POS + tier enterprise"],
            ["Identity-as-a-Service", "€ 0,05 per verifica KYC riusabile"],
            ["Hardware POS", "Margine 28% su unità vendute"],
          ].map(([k, v]) => (
            <div key={k} className="p-6 rounded-xl glass">
              <div className="font-display text-xl text-gold">{k}</div>
              <div className="mt-2 text-sm text-muted-foreground">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why now */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border border-gold/20 p-10 bg-card">
          <h2 className="font-display text-4xl">Perché ora</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-6 text-muted-foreground">
            <p>Sensori biometrici sotto i €4/unità. Liveness detection ML in real-time. PSD2 SCA maturato e implementato.</p>
            <p>Consumatori abituati a Touch ID e Face ID. Retail premium cerca differenziazione frictionless. Crypto stablecoin pronte per checkout.</p>
          </div>
        </div>
      </section>

      {/* Ask */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-gold">Round</div>
        <h2 className="mt-4 font-display text-5xl md:text-6xl">Seed · <span className="text-gradient-gold">€ 4,5 M</span></h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          18 mesi di runway. Team ingegneria security & ML, 50 POS pilot, certificazioni PCI/SOC2,
          partnership con un acquirer Tier-2 e un'autorità di trasporto EU.
        </p>
        <a href="mailto:investors@fingerpay.io" className="mt-10 inline-block px-8 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold">
          investors@fingerpay.io
        </a>
      </section>

      <SiteFooter />
    </div>
  );
}
