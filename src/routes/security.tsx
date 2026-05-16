import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldCheck, Lock, FileLock, Cpu, ScrollText, Globe } from "lucide-react";

export const Route = createFileRoute("/security")({
  component: Security,
  head: () => ({ meta: [
    { title: "Sicurezza · FingerPay" },
    { name: "description", content: "Modello di sicurezza, compliance PSD2/GDPR/PCI DSS, template biometrici cifrati, HSM, audit ledger e roadmap post-quantum." },
  ]}),
});

function Security() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="pt-32 pb-16 mx-auto max-w-7xl px-6">
        <div className="text-xs uppercase tracking-[0.3em] text-gold">Sicurezza</div>
        <h1 className="mt-4 text-5xl md:text-7xl">Difesa in profondità.<br /><span className="text-gradient-gold italic">Privacy by design.</span></h1>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-2 gap-6">
        {[
          { i: ShieldCheck, t: "Template biometrico cifrato", d: "L'impronta non viene mai memorizzata come immagine o hash diretto. Viene trasformata in un vettore numerico, cifrato con chiave HSM e reso non invertibile tramite cancellable biometrics. Revocabile e rigenerabile per utente." },
          { i: Lock, t: "Matching sicuro in TEE", d: "Il confronto avviene in Trusted Execution Environment sul POS o in secure enclave cloud. Nessun template grezzo è mai esposto a memoria utente." },
          { i: Cpu, t: "HSM FIPS 140-3 Level 3", d: "Chiavi master e chiavi di derivazione gestite in hardware certificato. Operazioni crittografiche atomiche e audit firmati." },
          { i: FileLock, t: "Database segregati e cifrati", d: "Identità, pagamenti, biglietti, loyalty e accessi vivono in cluster Postgres indipendenti con AES-256-GCM at rest e chiavi per dominio." },
          { i: ScrollText, t: "Audit ledger immutabile", d: "Ogni evento sensibile firmato e ancorato su Hyperledger Fabric. Anti-replay, anti-tamper, prova legale in caso di dispute." },
          { i: Globe, t: "Compliance regolamentare", d: "PSD2 + SCA, GDPR (data minimization, right to be forgotten via revoca template), PCI DSS Level 1, eIDAS-ready per identità digitale." },
        ].map((s) => (
          <div key={s.t} className="p-8 rounded-2xl glass">
            <s.i className="h-7 w-7 text-gold" strokeWidth={1.5} />
            <h3 className="mt-4 text-2xl">{s.t}</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">{s.d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent p-10">
          <div className="text-xs uppercase tracking-widest text-gold">Precisazione regolamentare</div>
          <h3 className="mt-3 font-display text-3xl">Due dita ≠ SCA</h3>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            L'uso di un secondo dito costituisce <strong className="text-foreground">autenticazione biometrica rafforzata</strong>:
            aumenta la robustezza biometrica ma rimane all'interno del fattore <em>inherence</em>.
            PSD2 richiede invece la combinazione di almeno due fattori indipendenti tra
            <em> knowledge</em> (PIN), <em>possession</em> (dispositivo registrato, app companion) e <em>inherence</em> (biometria).
            FingerPay attiva SCA combinando il dito con PIN o app companion sopra soglie configurabili per merchant.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl">Rischi & mitigazioni</h2>
        <div className="mt-8 rounded-2xl glass overflow-hidden divide-y divide-border/40">
          {[
            ["Normativo", "Interpretazioni divergenti GDPR su biometria art. 9", "DPIA per ogni mercato · biometria solo on-device opzionale · template revocabili"],
            ["Tecnico", "Spoofing dell'impronta (silicone, foto)", "Liveness detection multispettrale · attestazione hardware POS · ML anti-spoof"],
            ["Operativo", "Compromissione HSM o provider cloud", "Multi-HSM multi-cloud · key ceremony · disaster recovery cross-region"],
            ["Reputazionale", "Percezione 'sorveglianza biometrica'", "Comunicazione su zero-PII · controllo utente · open audit reports"],
            ["Crittografico", "Avvento del calcolo quantistico", "Roadmap Kyber/Dilithium · crypto-agility nel protocollo token"],
          ].map(([cat, risk, mit]) => (
            <div key={risk} className="grid md:grid-cols-[120px_1fr_1fr] gap-4 p-5">
              <span className="text-xs uppercase tracking-widest text-gold">{cat}</span>
              <span className="text-sm">{risk}</span>
              <span className="text-sm text-muted-foreground">{mit}</span>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
