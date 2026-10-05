import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ScrollText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Termini di Servizio · FingerPay" },
      { name: "description", content: "Termini e condizioni d'uso della piattaforma FingerPay." },
      { property: "og:title", content: "Termini di Servizio · FingerPay" },
      { property: "og:description", content: "Termini e condizioni d'uso della piattaforma FingerPay." },
    ],
  }),
});

const sections = [
  {
    title: "1. Oggetto del servizio",
    body: "FingerPay è una piattaforma di wallet digitale che consente di archiviare carte, tessere e documenti e di autorizzare operazioni tramite verifica biometrica del dispositivo. Il servizio di pagamento è attualmente in modalità dimostrativa: nessuna transazione monetaria reale viene eseguita fino all'integrazione con un fornitore di servizi di pagamento autorizzato.",
  },
  {
    title: "2. Registrazione e account",
    body: "Per usare il servizio devi registrarti con email e password e avere almeno 18 anni. Sei responsabile della riservatezza delle tue credenziali e del PIN. L'autenticazione biometrica avviene tramite il sistema operativo del tuo dispositivo: FingerPay non ha accesso alle tue impronte digitali.",
  },
  {
    title: "3. Uso consentito",
    body: "Ti impegni a: caricare solo carte, tessere e documenti di cui sei legittimo titolare; non usare il servizio per frodi, riciclaggio o attività illecite; non tentare di aggirare i meccanismi di sicurezza. La violazione comporta la sospensione dell'account.",
  },
  {
    title: "4. Autorizzazioni e soglie",
    body: "Le operazioni sopra soglia richiedono un secondo fattore (PIN o conferma tramite app). La conferma con secondo dito costituisce autenticazione biometrica rafforzata e non equivale automaticamente alla Strong Customer Authentication ai sensi della PSD2, che richiede la combinazione di due fattori di categorie diverse.",
  },
  {
    title: "5. Disponibilità e limitazioni",
    body: "Il servizio è fornito 'così com'è'. Non garantiamo disponibilità continua né l'assenza di errori. Le funzioni di riconoscimento automatico (OCR, barcode, AI) sono ausili e possono contenere errori: verifica sempre i dati prima del salvataggio.",
  },
  {
    title: "6. Responsabilità",
    body: "Non siamo responsabili per: smarrimento del dispositivo o compromissione delle credenziali dovuta a negligenza dell'utente; danni indiretti o lucro cessante; malfunzionamenti dei servizi di terze parti integrati. In ogni caso la responsabilità massima è limitata all'importo degli eventuali canoni pagati negli ultimi 12 mesi.",
  },
  {
    title: "7. Modifiche e recesso",
    body: "Possiamo modificare i termini con preavviso di 30 giorni. Puoi chiudere l'account in qualsiasi momento: i tuoi dati saranno cancellati secondo quanto previsto dalla Privacy Policy.",
  },
  {
    title: "8. Legge applicabile",
    body: "I presenti termini sono regolati dalla legge italiana. Per le controversie è competente il foro del consumatore, ove applicabile.",
  },
];

function TermsPage() {
  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <Link to="/wallet" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> App
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <ScrollText className="h-7 w-7 text-gold" />
        <h1 className="text-4xl font-display">Termini di Servizio</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Ultimo aggiornamento: ottobre 2026</p>
      <div className="mt-8 space-y-6">
        {sections.map((s) => (
          <section key={s.title} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-display">{s.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
