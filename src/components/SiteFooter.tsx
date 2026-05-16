export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border/30">
      <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-4 gap-12">
        <div>
          <div className="font-display text-2xl">FingerPay</div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            La tua identità è il tuo pagamento. Sicura, anonima, sovrana.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-4">Prodotto</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>POS biometrico</li>
            <li>SDK & API</li>
            <li>App companion</li>
            <li>Wallet routing</li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-4">Compliance</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>PSD2 / SCA</li>
            <li>GDPR</li>
            <li>PCI DSS Level 1</li>
            <li>ISO 27001</li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-4">Contatti</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>hello@fingerpay.io</li>
            <li>Milano · London · Singapore</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/30 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FingerPay Labs. Tutti i diritti riservati.
      </div>
    </footer>
  );
}
