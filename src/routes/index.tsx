import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import heroImg from "@/assets/hero-fingerprint.jpg";
import posImg from "@/assets/pos-device.jpg";
import securityBg from "@/assets/security-bg.jpg";
import { Fingerprint, Shield, Zap, Wallet, Ticket, KeyRound, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "FingerPay — La tua identità è il tuo pagamento" },
      { name: "description", content: "Pagamenti, biglietti, accessi e wallet con un solo dito. La piattaforma biometrica conforme PSD2, GDPR e PCI DSS." },
    ],
  }),
});

function Home() {
  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* HERO */}
      <section className="relative pt-32 pb-24 overflow-hidden noise">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-40" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs tracking-widest uppercase text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-gold" />
              Biometric Identity Layer
            </div>
            <h1 className="mt-6 text-5xl md:text-7xl lg:text-8xl leading-[0.95]">
              La tua identità<br />
              <span className="text-gradient-gold italic">è il tuo pagamento.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
              FingerPay trasforma l'impronta in una chiave universale per pagamenti, biglietti,
              loyalty e accessi. Nessuna carta. Nessuna password. Nessun dato esposto al merchant.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/technology" className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold hover:scale-[1.02] transition">
                Scopri la tecnologia
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </Link>
              <Link to="/merchants" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gold/30 text-foreground hover:bg-gold/5 transition">
                Demo dashboard
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-6 text-xs uppercase tracking-widest text-muted-foreground">
              <span>PSD2 · SCA</span><span className="text-gold/30">•</span>
              <span>GDPR</span><span className="text-gold/30">•</span>
              <span>PCI DSS L1</span><span className="text-gold/30">•</span>
              <span>Post-Quantum Ready</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative animate-float">
              <div className="absolute -inset-10 radial-gold blur-2xl" />
              <div className="relative glass rounded-3xl p-8 shadow-luxe">
                <Fingerprint className="h-32 w-32 text-gold mx-auto" strokeWidth={1} />
                <div className="mt-6 text-center">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Identificazione in corso</div>
                  <div className="mt-2 font-display text-2xl">Token generato</div>
                  <div className="mt-1 text-xs text-gold font-mono">tx_8f3a··b21e · monouso</div>
                </div>
                <div className="mt-6 pt-6 border-t border-border/40 grid grid-cols-3 gap-3 text-center">
                  <div><div className="text-2xl font-display text-gold">~0.4s</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Match</div></div>
                  <div><div className="text-2xl font-display text-gold">256</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">AES bit</div></div>
                  <div><div className="text-2xl font-display text-gold">0</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">PII esposti</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="py-32 mx-auto max-w-5xl px-6 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-gold">Manifesto</div>
        <p className="mt-8 font-display text-3xl md:text-5xl leading-tight">
          "Il dito non contiene dati di pagamento.<br />
          <span className="text-muted-foreground italic">Dimostra solo chi sei</span> — e autorizza<br />
          l'invio del token corretto al servizio richiesto."
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-card/30 border-y border-border/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.3em] text-gold">Come funziona</div>
            <h2 className="mt-4 text-4xl md:text-5xl">Sette passi. Zero attriti.</h2>
          </div>
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "01", t: "Richiesta servizio", d: "POS, gate o terminale dichiara il tipo di operazione." },
              { n: "02", t: "Identificazione", d: "L'utente appoggia il primo dito. Liveness detection in tempo reale." },
              { n: "03", t: "Match sicuro", d: "Template biometrico cifrato confrontato in secure enclave." },
              { n: "04", t: "Profilo anonimo", d: "Recupero dell'ID biometrico senza esporre dati personali." },
              { n: "05", t: "SCA condizionale", d: "Sopra soglia: secondo dito, PIN o app companion." },
              { n: "06", t: "Token monouso", d: "Generato e cifrato per il singolo servizio richiesto." },
              { n: "07", t: "Routing wallet", d: "Conto bancario, crypto wallet, biglietto o accesso." },
              { n: "08", t: "Audit immutabile", d: "Evento registrato su ledger, nessun PII al merchant." },
            ].map((s) => (
              <div key={s.n} className="group relative p-6 rounded-2xl glass hover:border-gold/40 transition">
                <div className="font-display text-gold text-2xl">{s.n}</div>
                <div className="mt-3 font-medium">{s.t}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WALLET ROUTING */}
      <section className="py-32 mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold">Wallet Routing</div>
            <h2 className="mt-4 text-4xl md:text-5xl">Un dito, infiniti contesti.</h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              FingerPay riconosce il contesto della richiesta e apre il wallet corretto.
              Il merchant riceve solo ciò che gli serve: un token, non la tua vita.
            </p>
            <div className="mt-10 space-y-4">
              {[
                { icon: Wallet, t: "Pagamenti", d: "Token EMV one-time verso banca o stablecoin." },
                { icon: Ticket, t: "Biglietti & accessi", d: "Aerei, treni, eventi, palestre, hotel." },
                { icon: KeyRound, t: "Identità digitale", d: "SPID-like, KYC riutilizzabile, age verification." },
                { icon: Shield, t: "Loyalty & wallet crypto", d: "Punti, NFT, USDC/USDT, multi-chain." },
              ].map((i) => (
                <div key={i.t} className="flex items-start gap-4 group">
                  <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition">
                    <i.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <div className="font-medium">{i.t}</div>
                    <div className="text-sm text-muted-foreground">{i.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-12 radial-gold blur-3xl" />
            <img src={posImg} alt="POS biometrico FingerPay" loading="lazy" width={1024} height={1024} className="relative rounded-3xl shadow-luxe" />
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={securityBg} alt="" loading="lazy" width={1536} height={800} className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-gold">Security Model</div>
            <h2 className="mt-4 text-4xl md:text-6xl">Zero PII. Zero compromessi.</h2>
            <p className="mt-6 text-muted-foreground text-lg">
              L'impronta non viene "hashata come una password". Viene convertita in un
              <span className="text-gold"> template biometrico cifrato</span>, utilizzando
              <span className="text-gold"> cancellable biometrics</span> e
              <span className="text-gold"> matching sicuro</span> in secure enclave.
            </p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              { t: "Template biometrico cifrato", d: "Trasformazione non invertibile, rigenerabile e revocabile per utente. Nessun dato grezzo lascia il dispositivo." },
              { t: "HSM & Secure Enclave", d: "Chiavi master in hardware certificato FIPS 140-3. Matching in TEE su POS." },
              { t: "Tokenizzazione EMV", d: "Ogni transazione genera un token monouso scopato al singolo merchant e contesto." },
              { t: "Audit ledger immutabile", d: "Eventi firmati su Hyperledger Fabric. Anti-replay, anti-tamper, GDPR-compliant." },
              { t: "Database segregati", d: "Pagamenti, identità, loyalty e accessi in domini crittografici separati con chiavi indipendenti." },
              { t: "Post-Quantum Ready", d: "Schema crittografico predisposto a Kyber, Dilithium e algoritmi NIST PQC." },
            ].map((s) => (
              <div key={s.t} className="p-6 rounded-2xl glass hover:border-gold/40 transition">
                <CheckCircle2 className="h-5 w-5 text-gold" />
                <div className="mt-4 font-display text-xl">{s.t}</div>
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-12 p-6 rounded-2xl border border-gold/20 bg-card/40 max-w-3xl mx-auto">
            <div className="text-xs uppercase tracking-widest text-gold">Nota normativa</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Due dita costituiscono <span className="text-foreground">autenticazione biometrica rafforzata</span>,
              non SCA secondo PSD2. Per Strong Customer Authentication FingerPay combina biometria con un
              secondo fattore indipendente: PIN, app companion o dispositivo registrato.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 mx-auto max-w-5xl px-6 text-center">
        <Zap className="h-12 w-12 text-gold mx-auto" strokeWidth={1} />
        <h2 className="mt-6 text-4xl md:text-6xl">Pronto a toccare il futuro?</h2>
        <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
          Integrazione SDK in 48 ore. Pilot merchant in 4 settimane. Prima transazione live nel trimestre.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link to="/merchants" className="px-8 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold">
            Richiedi pilot
          </Link>
          <Link to="/investors" className="px-8 py-3 rounded-full border border-gold/30 hover:bg-gold/5 transition">
            Pitch investitori
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
