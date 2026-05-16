import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/roadmap")({
  component: Roadmap,
  head: () => ({ meta: [
    { title: "Roadmap & MVP · FingerPay" },
    { name: "description", content: "Roadmap di sviluppo, definizione MVP realistico, milestone tecniche e commerciali." },
  ]}),
});

const phases = [
  { q: "Q1", t: "MVP Foundation", items: ["Onboarding & KYC base", "Enrolment biometrico (1 dito)", "Match server-side in enclave", "Integrazione 1 banca pilot via SEPA Instant", "POS reference design (Android + sensore)", "Dashboard merchant v0"], color: "from-gold/30" },
  { q: "Q2", t: "Pilot commerciale", items: ["10 merchant retail boutique Milano", "Secondo fattore: PIN + app companion", "Tokenizzazione EMV one-time", "Audit ledger Hyperledger basic", "DPIA + GDPR sign-off", "SOC2 Type 1 kickoff"], color: "from-gold/40" },
  { q: "Q3", t: "Scale verticali", items: ["Estensione: biglietti treno + accesso palestre", "Wallet crypto USDC/USDT su Polygon", "SDK pubblico per terzi", "Multi-region deploy EU", "PSD2 SCA full compliance audit", "PCI DSS Level 1 certification"], color: "from-gold/50" },
  { q: "Q4", t: "Identità digitale", items: ["eIDAS Wallet integration", "Age verification reusable", "Loyalty cross-merchant network", "API marketplace per partner", "200+ merchant attivi", "Serie A fundraising"], color: "from-gold/60" },
  { q: "Y2+", t: "Post-quantum & global", items: ["Migrazione algoritmi Kyber/Dilithium", "Espansione UK + Singapore + UAE", "Banking partnership Tier-1", "Hardware POS proprietario v2", "1M+ identità biometriche enrolled", "IPO readiness"], color: "from-gold/80" },
];

const mvp = [
  ["Enrolment", "Web onboarding + KYC + 2 dita registrate in enclave"],
  ["Identificazione", "API /identify con liveness detection software"],
  ["Pagamento", "Token EMV verso 1 acquirer + fallback Apple/Google Pay"],
  ["SCA", "PIN 6 cifre sopra €30 (configurabile)"],
  ["POS", "Tablet Android + sensore USB certificato, app FingerPay POS"],
  ["Merchant dashboard", "Transazioni · refund · settlement giornaliero"],
  ["Audit", "Log append-only su Postgres + hash chain (Fabric in Q2)"],
  ["Security", "TLS 1.3, AES-256, HSM cloud (es. AWS CloudHSM)"],
];

function Roadmap() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="pt-32 pb-12 mx-auto max-w-7xl px-6">
        <div className="text-xs uppercase tracking-[0.3em] text-gold">Roadmap</div>
        <h1 className="mt-4 text-5xl md:text-7xl">Dal pilot<br /><span className="text-gradient-gold italic">alla rete globale.</span></h1>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 space-y-6">
        {phases.map((p, idx) => (
          <div key={p.q} className={`relative rounded-3xl glass p-8 md:p-10 bg-gradient-to-r ${p.color} via-transparent to-transparent`}>
            <div className="flex flex-wrap gap-6 items-baseline">
              <div className="font-display text-6xl text-gradient-gold">{p.q}</div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Fase {idx + 1}</div>
                <div className="font-display text-3xl">{p.t}</div>
              </div>
            </div>
            <ul className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {p.items.map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-gold flex-none" />{i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl">MVP realistico — Q1</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Quello che entra nel primo rilascio. Tutto il resto è feature, non MVP.
        </p>
        <div className="mt-8 rounded-2xl glass divide-y divide-border/40">
          {mvp.map(([k, v]) => (
            <div key={k} className="grid md:grid-cols-[200px_1fr] gap-4 p-5">
              <span className="text-xs uppercase tracking-widest text-gold">{k}</span>
              <span className="text-sm text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
