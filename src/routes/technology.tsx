import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/technology")({
  component: Technology,
  head: () => ({ meta: [
    { title: "Tecnologia · FingerPay" },
    { name: "description", content: "Architettura microservizi, schema database, API REST/GraphQL, HSM, tokenizzazione EMV e roadmap post-quantum." },
  ]}),
});

const apis = [
  { m: "POST", p: "/v1/identify", d: "Match biometrico → ritorna biometric_id anonimo + scoped session token" },
  { m: "POST", p: "/v1/authorize", d: "Genera token monouso per (service_type, merchant_id, amount)" },
  { m: "POST", p: "/v1/sca/challenge", d: "Avvia secondo fattore (PIN/app/secondo dito) sopra soglia" },
  { m: "POST", p: "/v1/wallet/route", d: "Risolve il wallet corretto in base al contesto del servizio" },
  { m: "POST", p: "/v1/payments/capture", d: "Cattura pagamento tokenizzato verso banca o stablecoin" },
  { m: "GET", p: "/v1/merchant/transactions", d: "Lista paginata transazioni con stato, importo, settlement" },
  { m: "POST", p: "/v1/consent/grant", d: "Registra consenso GDPR scopato al merchant e al servizio" },
  { m: "GET", p: "/v1/audit/:tx_id", d: "Recupera prova immutabile su ledger Hyperledger Fabric" },
];

const schema = [
  { name: "biometric_identities", cols: ["id (uuid)", "template_ref (HSM key)", "created_at", "revoked_at", "version"] },
  { name: "linked_accounts", cols: ["id", "biometric_id (fk)", "type (bank|crypto|loyalty|ticket|id)", "provider", "external_ref (encrypted)"] },
  { name: "consents", cols: ["id", "biometric_id", "merchant_id", "scope", "granted_at", "revoked_at"] },
  { name: "transactions", cols: ["id", "merchant_id", "amount", "currency", "status", "token_hash", "ledger_ref"] },
  { name: "merchants", cols: ["id", "name", "vertical", "pos_devices", "settlement_account"] },
  { name: "sca_events", cols: ["id", "tx_id", "factor", "result", "device_attestation"] },
  { name: "audit_log", cols: ["id", "event_type", "actor_ref", "payload_hash", "ledger_block", "ts"] },
];

function Technology() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="pt-32 pb-16 mx-auto max-w-7xl px-6">
        <div className="text-xs uppercase tracking-[0.3em] text-gold">Tecnologia</div>
        <h1 className="mt-4 text-5xl md:text-7xl">Architettura ingegnerizzata<br /><span className="text-gradient-gold italic">per la fiducia.</span></h1>
        <p className="mt-6 max-w-2xl text-muted-foreground text-lg">
          Microservizi Go/Node.js, PostgreSQL segregato, Redis per sessioni effimere,
          HSM per chiavi master e Kubernetes per scaling orizzontale geografico.
        </p>
      </section>

      {/* Architecture diagram */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="glass rounded-3xl p-8 md:p-12">
          <div className="text-xs uppercase tracking-widest text-gold">Architettura software</div>
          <pre className="mt-6 text-[11px] md:text-sm leading-relaxed text-muted-foreground overflow-x-auto font-mono">
{`  ┌──────────────────────────────────────────────────────────────┐
  │   DEVICE LAYER — POS · Gate · Tornello · Scanner loyalty     │
  │   Sensor · Liveness · Secure Enclave · Local TEE match       │
  └──────────────────────────┬───────────────────────────────────┘
                             │  mTLS · attestation
  ┌──────────────────────────▼───────────────────────────────────┐
  │                    API GATEWAY (REST + GraphQL)              │
  │             Rate limit · JWT scoped · WAF · DDoS             │
  └─┬──────────┬──────────┬──────────┬──────────┬─────────┬─────┘
    │          │          │          │          │         │
  ┌─▼──┐    ┌──▼──┐    ┌──▼──┐    ┌──▼───┐  ┌───▼──┐  ┌──▼───┐
  │Id. │    │ SCA │    │Wall.│    │ Pay  │  │Loyal.│  │Tick. │
  │svc │    │ svc │    │route│    │ svc  │  │ svc  │  │  svc │
  └─┬──┘    └──┬──┘    └──┬──┘    └──┬───┘  └──┬───┘  └──┬───┘
    │          │          │          │         │         │
  ┌─▼──────────▼──────────▼──────────▼─────────▼─────────▼─────┐
  │   HSM / KMS  ·  Redis (sessions)  ·  Kafka (events)        │
  └─┬──────────────────────────────────────────────────────────┬┘
    │                                                          │
  ┌─▼──────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
  │ Postgres   │ │ Postgres   │ │ Postgres   │ │ Hyperledger │◄┘
  │ identities │ │ payments   │ │ services   │ │ audit ledger│
  └────────────┘ └────────────┘ └────────────┘ └─────────────┘`}
          </pre>
        </div>
      </section>

      {/* Stack */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl">Stack tecnologico</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            ["Backend", "Go (perf) · Node.js (BFF)"],
            ["API", "REST · GraphQL · gRPC interno"],
            ["Database", "PostgreSQL segregato per dominio"],
            ["Cache", "Redis · sessioni effimere TTL"],
            ["Sicurezza", "TLS 1.3 · AES-256-GCM · HSM FIPS 140-3"],
            ["Frontend", "React · TanStack Start"],
            ["Mobile", "Flutter (companion opzionale)"],
            ["Infra", "Docker · Kubernetes · multi-region"],
            ["Crypto", "Ethereum · Polygon · Solana · USDC/USDT"],
            ["Audit", "Hyperledger Fabric · Corda (alt)"],
            ["Osservabilità", "OpenTelemetry · Grafana · SIEM"],
            ["PQC", "Kyber · Dilithium pronti per migrazione"],
          ].map(([k, v]) => (
            <div key={k} className="p-5 rounded-xl glass">
              <div className="text-xs uppercase tracking-widest text-gold">{k}</div>
              <div className="mt-2 text-sm">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Schema */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl">Schema database</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl">Ogni dominio in cluster isolato con chiavi di cifratura indipendenti.</p>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schema.map((t) => (
            <div key={t.name} className="rounded-xl glass overflow-hidden">
              <div className="px-5 py-3 border-b border-gold/20 font-mono text-sm text-gold">{t.name}</div>
              <ul className="p-5 space-y-1.5 text-xs font-mono text-muted-foreground">
                {t.cols.map((c) => <li key={c}>· {c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* APIs */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl">API principali</h2>
        <div className="mt-8 rounded-2xl glass overflow-hidden divide-y divide-border/40">
          {apis.map((a) => (
            <div key={a.p} className="grid grid-cols-[80px_1fr] md:grid-cols-[80px_300px_1fr] gap-4 p-4 hover:bg-gold/5 transition">
              <span className="text-xs font-mono px-2 py-1 rounded bg-gold/15 text-gold text-center self-start">{a.m}</span>
              <code className="text-sm font-mono text-foreground">{a.p}</code>
              <span className="text-sm text-muted-foreground">{a.d}</span>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
