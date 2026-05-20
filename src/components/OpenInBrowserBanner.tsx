import { ExternalLink, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Avviso critico: WebAuthn (Face ID / Touch ID / impronta) NON funziona
 * dentro l'iframe della preview di Lovable perché il browser blocca le
 * Permissions Policy `publickey-credentials-*` negli iframe cross-origin.
 * L'utente DEVE aprire la pagina in una scheda nativa del browser del
 * telefono (Safari su iPhone, Chrome su Android) per vedere il prompt reale.
 */
export function OpenInBrowserBanner() {
  const [inIframe, setInIframe] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    try {
      setInIframe(window.top !== window.self);
    } catch {
      setInIframe(true); // accesso cross-origin = sicuramente in iframe
    }
    setUrl(window.location.href);
  }, []);

  if (!inIframe) return null;

  return (
    <div className="p-4 rounded-2xl border border-red-500/40 bg-red-500/5 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
      <div className="flex-1">
        <div className="font-medium text-red-700 dark:text-red-400">
          Apri la pagina in una scheda reale del browser
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          La scansione dell'impronta usa Face ID / Touch ID / impronta del telefono e
          <strong> non funziona dentro l'anteprima incorporata</strong> (il browser blocca
          WebAuthn negli iframe). Apri il link da Safari (iPhone) o Chrome (Android).
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white text-sm"
        >
          <ExternalLink className="h-4 w-4" /> Apri in scheda nuova
        </a>
      </div>
    </div>
  );
}
