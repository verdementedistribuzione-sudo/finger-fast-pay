import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy · FingerPay" },
      { name: "description", content: "Informativa privacy di FingerPay: dati raccolti, finalità, diritti GDPR." },
      { property: "og:title", content: "Privacy Policy · FingerPay" },
      { property: "og:description", content: "Informativa privacy di FingerPay: dati raccolti, finalità, diritti GDPR." },
    ],
  }),
});

const sections = [
  {
    title: "1. Titolare del trattamento",
    body: "Il titolare del trattamento dei dati personali raccolti tramite FingerPay è il gestore del servizio. Per qualsiasi richiesta relativa alla privacy puoi contattarci all'indirizzo email indicato nell'app.",
  },
  {
    title: "2. Dati raccolti",
    body: "Raccogliamo: dati anagrafici e di contatto (nome, email) forniti in registrazione; dati dei documenti e delle tessere che carichi volontariamente nel wallet (numeri carta parziali, codici tessera, barcode); dati tecnici dei dispositivi registrati per l'autenticazione biometrica (identificativi di credenziale WebAuthn, mai il template biometrico); log di audit con esito e timestamp delle operazioni.",
  },
  {
    title: "3. Dati biometrici",
    body: "FingerPay non riceve né conserva impronte digitali o template biometrici. La verifica biometrica avviene interamente sul tuo dispositivo tramite WebAuthn: il sistema operativo conferma l'identità e l'app riceve solo una firma crittografica di avvenuta verifica. Nessun dato biometrico lascia il telefono.",
  },
  {
    title: "4. Finalità e base giuridica",
    body: "I dati sono trattati per: erogare il servizio di wallet digitale e autenticazione (esecuzione del contratto); garantire la sicurezza delle transazioni e prevenire frodi (legittimo interesse); adempiere obblighi di legge in materia contabile e antiriciclaggio (obbligo legale); inviare comunicazioni di servizio (consenso, ove richiesto).",
  },
  {
    title: "5. Conservazione",
    body: "I dati del wallet sono conservati finché l'account è attivo. I log di audit sono conservati per 24 mesi per finalità di sicurezza. I dati sensibili salvati nel wallet locale sono cifrati sul dispositivo con AES-GCM e chiave derivata dalla tua password: non sono accessibili a terzi né al server.",
  },
  {
    title: "6. Condivisione con terzi",
    body: "I dati non sono venduti a terzi. Possono essere comunicati a: fornitori di infrastruttura cloud che ospitano il servizio; circuiti di pagamento, solo per le transazioni che autorizzi esplicitamente; autorità competenti, nei casi previsti dalla legge.",
  },
  {
    title: "7. I tuoi diritti (GDPR artt. 15-22)",
    body: "Hai diritto di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione al trattamento. Puoi revocare il consenso in qualsiasi momento e proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).",
  },
  {
    title: "8. Sicurezza",
    body: "Applichiamo cifratura in transito (TLS 1.3), cifratura a riposo, segregazione dei dati per categoria, log di audit immutabili e protezione anti-replay sui token di transazione. I token di pagamento sono monouso e non espongono mai i dati della carta al merchant.",
  },
];

function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <Link to="/wallet" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> App
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-gold" />
        <h1 className="text-4xl font-display">Privacy Policy</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Ultimo aggiornamento: ottobre 2026 · Informativa ai sensi del Reg. UE 2016/679 (GDPR)</p>
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
