import { Check, Fingerprint, Loader2 } from "lucide-react";

type ScanState = "idle" | "scanning" | "done";

/**
 * Visualizzazione del rilevamento biometrico hardware.
 * Le creste vengono "illuminate" progressivamente per mostrare
 * la cattura del template (che resta nell'enclave del device).
 */
export function FingerprintScan({
  state,
  label,
  size = 160,
}: {
  state: ScanState;
  label?: string;
  size?: number;
}) {
  const scanning = state === "scanning";
  const done = state === "done";

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div
        className="relative rounded-full border-2 flex items-center justify-center overflow-hidden transition-colors"
        style={{
          width: size,
          height: size,
          borderColor: done ? "rgb(16 185 129 / 0.6)" : "hsl(var(--gold, 43 74% 49%) / 0.6)",
          background: done
            ? "radial-gradient(circle, rgb(16 185 129 / 0.08), transparent 70%)"
            : "radial-gradient(circle, hsl(var(--gold, 43 74% 49%) / 0.08), transparent 70%)",
        }}
      >
        {/* SVG con creste dell'impronta */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-3">
          <defs>
            <linearGradient id="ridge-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.78 0.14 80)" />
              <stop offset="100%" stopColor="oklch(0.62 0.16 60)" />
            </linearGradient>
            <linearGradient id="ridge-done" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(52 211 153)" />
              <stop offset="100%" stopColor="rgb(16 185 129)" />
            </linearGradient>
            <clipPath id="fp-clip">
              <path d="M50 8 C 28 8 14 26 14 50 C 14 70 22 86 30 92 M50 14 C 32 14 20 30 20 50 C 20 66 26 80 34 88 M50 22 C 36 22 26 34 26 50 C 26 62 30 74 38 82 M50 30 C 40 30 32 38 32 50 C 32 60 36 70 42 78 M50 38 C 44 38 38 42 38 50 C 38 58 42 66 46 72 M50 46 C 48 46 46 48 46 50 C 46 54 48 60 50 66" stroke="white" strokeWidth="2" fill="none" />
            </clipPath>
          </defs>

          {/* Creste statiche (lievi) */}
          <g stroke={done ? "url(#ridge-done)" : "url(#ridge-gold)"} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={done ? 0.95 : 0.35}>
            <path d="M50 10 C 28 10 14 28 14 52 C 14 72 22 86 30 92" />
            <path d="M50 16 C 32 16 20 32 20 52 C 20 68 26 80 34 88" />
            <path d="M50 24 C 36 24 26 36 26 52 C 26 64 30 74 38 84" />
            <path d="M50 32 C 40 32 32 40 32 52 C 32 62 36 70 42 78" />
            <path d="M50 40 C 44 40 38 44 38 52 C 38 60 42 66 46 72" />
            <path d="M50 48 C 48 48 46 50 46 52 C 46 56 48 62 50 68" />
            <path d="M52 12 C 70 12 84 30 84 52 C 84 72 76 86 68 92" />
            <path d="M54 18 C 68 18 78 34 78 52 C 78 68 72 80 66 88" />
            <path d="M56 26 C 66 26 72 38 72 52 C 72 64 68 74 62 82" />
          </g>

          {/* Barra di scansione animata */}
          {scanning && (
            <g clipPath="url(#fp-clip)">
              <rect x="0" width="100" height="6" fill="oklch(0.85 0.18 80)" opacity="0.9">
                <animate attributeName="y" from="6" to="92" dur="1.4s" repeatCount="indefinite" />
              </rect>
              <rect x="0" width="100" height="22" fill="oklch(0.85 0.18 80)" opacity="0.18">
                <animate attributeName="y" from="-10" to="92" dur="1.4s" repeatCount="indefinite" />
              </rect>
            </g>
          )}
        </svg>

        {/* Icona centrale */}
        <div className="relative z-10">
          {done ? (
            <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
          ) : scanning ? (
            <Loader2 className="h-8 w-8 text-gold animate-spin opacity-60" />
          ) : (
            <Fingerprint className="h-10 w-10 text-gold opacity-70" />
          )}
        </div>
      </div>

      {label && (
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {label}
          {done && <span className="ml-2 text-emerald-600 normal-case tracking-normal">acquisita</span>}
          {scanning && <span className="ml-2 text-gold normal-case tracking-normal">scansione…</span>}
        </div>
      )}
    </div>
  );
}
