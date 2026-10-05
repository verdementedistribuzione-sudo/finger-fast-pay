import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/gdpr")({
  component: GdprPage,
  head: () => ({
    meta: [
      { title: "Registro dei Trattamenti · FingerPay" },
      { name: "description", content: "Registro delle attività di trattamento ai sensi dell'art. 30 GDPR." },
      { property: "og:title", content: "Registro dei Trattamenti · FingerPay" },
      { property: "og:description", content: "Registro delle attività di trattamento ai sensi dell'art. 30 GDPR." },
    ],
  }),
});

const treatments = [
  {
    name: "Gestione account utente",
    data: "Nome, email, credenziali di accesso",
    purpose: "Registrazione, autenticazione e erogazione del servizio",
    basis: "Esecuzione del contratto (art. 6.1.b)",
    retention: "Durata dell'account + 12 mesi",
    recipients: "Fornitore infrastruttura cloud",
  },
  {
    name: "Wallet digitale",
    data: "Carte di pagamento (parziali), tessere fedeltà, documenti caricati",
    purpose: "Archiviazione e presentazione di carte, tessere e documenti",
    basis: "Esecuzione del contratto (art. 6.1.b)",
    retention: "Fino a cancellazione da parte dell'utente",
    recipients: "Nessuno — dati sensibili cifrati localmente (AES-GCM)",
  },
  {
    name: "Autenticazione biometrica",
    data: "Identificativi credenziale WebAuthn, stato dispositivo (nessun template biometrico)",
    purpose: "Verifica dell'identità e autorizzazione operazioni",
    basis: "Consenso esplicito (art. 9.2.a) ed esecuzione del contratto",
    retention: "Fino a revoca del dispositivo",
    recipients: "Nessuno — la biometria resta sul dispositivo",
  },
  {
    name: "Audit e sicurezza",
    data: "Esito e timestamp di scansioni, transazioni, accessi (senza dati biometrici)",
    purpose: "Prevenzione frodi, tracciabilità, anti-replay",
    basis: "Legittimo interesse (art. 6.1.f)",
    retention: "24 mesi",
    recipients: "Solo personale autorizzato",
  },
  {
    name: "Richieste merchant",
    data: "Token monouso, importo, esito autorizzazione",
    purpose: "Esecuzione delle operazioni richieste dai merchant",
    basis: "Esecuzione del contratto (art. 6.1.b)",
    retention: "24 mesi",
    recipients: "Merchant richiedente (solo token, mai dati carta)",
  },
  {
    name: "Analytics aggregate",
    data: "Statistiche anonime di utilizzo per la dashboard amministrativa",
    purpose: "Miglioramento del servizio e reportistica",
    basis: "Legittimo interesse (art. 6.1.f)",
    retention: "Dati aggregati senza limite",
    recipients: "Amministratori della piattaforma",
  },
];

function GdprPage() {
  return (
    <div className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <Link to="/admin" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Admin
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <ClipboardList className="h-7 w-7 text-gold" />
        <h1 className="text-4xl font-display">Registro dei Trattamenti</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Registro delle attività di trattamento ai sensi dell'art. 30 del Reg. UE 2016/679 · Ultimo aggiornamento: ottobre 2026
      </p>
      <div className="mt-8 space-y-4">
        {treatments.map((t) => (
          <section key={t.name} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-display">{t.name}</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Dati trattati</dt>
                <dd className="mt-0.5">{t.data}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Finalità</dt>
                <dd className="mt-0.5">{t.purpose}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Base giuridica</dt>
                <dd className="mt-0.5">{t.basis}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Conservazione</dt>
                <dd className="mt-0.5">{t.retention}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Destinatari</dt>
                <dd className="mt-0.5">{t.recipients}</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Misure tecniche: cifratura TLS 1.3 in transito, cifratura a riposo, AES-GCM per il wallet locale, segregazione dei dati per categoria, log immutabili, token monouso anti-replay.
      </p>
    </div>
  );
}
