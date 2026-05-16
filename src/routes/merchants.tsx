import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { TrendingUp, CheckCircle2, Clock, XCircle, Fingerprint } from "lucide-react";

export const Route = createFileRoute("/merchants")({
  component: Merchants,
  head: () => ({ meta: [
    { title: "Merchant Dashboard · FingerPay" },
    { name: "description", content: "Dashboard merchant: transazioni in tempo reale, stato pagamenti, gestione POS e analytics anonime." },
  ]}),
});

const txs = [
  { id: "tx_8f3a··b21e", time: "14:32:08", amount: "€ 42,90", method: "Visa · Token", status: "ok", pos: "POS-MI-014" },
  { id: "tx_e22d··91ac", time: "14:31:44", amount: "€ 128,00", method: "USDC · Polygon", status: "ok", pos: "POS-MI-002" },
  { id: "tx_5b71··ff03", time: "14:30:12", amount: "€ 8,50", method: "Loyalty", status: "ok", pos: "POS-MI-014" },
  { id: "tx_aa90··3c44", time: "14:29:55", amount: "€ 540,00", method: "SEPA Instant", status: "sca", pos: "POS-MI-007" },
  { id: "tx_119f··d712", time: "14:28:01", amount: "€ 19,90", method: "Visa · Token", status: "ok", pos: "POS-MI-002" },
  { id: "tx_67c8··0aa1", time: "14:26:47", amount: "€ 76,40", method: "Apple Pay", status: "fail", pos: "POS-MI-014" },
  { id: "tx_d3b2··e8c9", time: "14:25:30", amount: "Biglietto", method: "Train · IT-MI-RM", status: "ok", pos: "GATE-MXP-A1" },
];

function StatusPill({ s }: { s: string }) {
  const map = {
    ok: { c: "text-emerald-400 bg-emerald-400/10", i: CheckCircle2, t: "Confermato" },
    sca: { c: "text-gold bg-gold/10", i: Clock, t: "SCA pending" },
    fail: { c: "text-red-400 bg-red-400/10", i: XCircle, t: "Fallito" },
  }[s as "ok" | "sca" | "fail"];
  const I = map.i;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${map.c}`}>
      <I className="h-3 w-3" /> {map.t}
    </span>
  );
}

function Merchants() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="pt-28 pb-8 mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold">Merchant · Anteprima</div>
            <h1 className="mt-3 text-4xl md:text-6xl">Boutique Brera, Milano</h1>
            <p className="mt-2 text-muted-foreground">3 POS attivi · ultimo settlement oggi alle 14:00</p>
          </div>
          <button className="px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium shadow-gold">
            Nuovo POS
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 grid md:grid-cols-4 gap-4">
        {[
          { k: "Transazioni oggi", v: "1.284", d: "+12,4%" },
          { k: "Volume", v: "€ 47.812", d: "+8,1%" },
          { k: "Tasso conversione", v: "98,3%", d: "+0,4 pp" },
          { k: "Tempo medio", v: "0,42s", d: "−6%" },
        ].map((s) => (
          <div key={s.k} className="p-6 rounded-2xl glass">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.k}</div>
            <div className="mt-3 font-display text-4xl">{s.v}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-gold"><TrendingUp className="h-3 w-3" />{s.d}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl glass overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <div className="font-display text-xl">Transazioni live</div>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Streaming
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="text-left px-6 py-3">ID Token</th><th className="text-left">Ora</th><th className="text-left">Importo</th><th className="text-left">Metodo</th><th className="text-left">POS</th><th className="text-left px-6">Stato</th></tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {txs.map((t) => (
                <tr key={t.id} className="hover:bg-gold/5 transition">
                  <td className="px-6 py-4 font-mono text-xs text-gold">{t.id}</td>
                  <td className="text-muted-foreground">{t.time}</td>
                  <td className="font-medium">{t.amount}</td>
                  <td className="text-muted-foreground">{t.method}</td>
                  <td className="font-mono text-xs text-muted-foreground">{t.pos}</td>
                  <td className="px-6"><StatusPill s={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl glass p-6">
            <div className="font-display text-xl">POS attivi</div>
            <ul className="mt-4 space-y-3">
              {[
                { id: "POS-MI-014", loc: "Cassa principale", on: true },
                { id: "POS-MI-002", loc: "Camerino premium", on: true },
                { id: "POS-MI-007", loc: "Outdoor terrace", on: true },
                { id: "POS-MI-021", loc: "Magazzino back", on: false },
              ].map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-4 w-4 text-gold" />
                    <div>
                      <div className="font-mono text-xs">{p.id}</div>
                      <div className="text-xs text-muted-foreground">{p.loc}</div>
                    </div>
                  </div>
                  <span className={`text-xs ${p.on ? "text-emerald-400" : "text-muted-foreground"}`}>
                    {p.on ? "Online" : "Offline"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl glass p-6">
            <div className="font-display text-xl">Analytics anonime</div>
            <div className="mt-4 space-y-3">
              {[
                ["Pagamenti carta", 62],
                ["Crypto stablecoin", 18],
                ["Loyalty", 14],
                ["Biglietti & accessi", 6],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{k}</span><span>{v}%</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-gradient-gold" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
