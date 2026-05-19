import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, AlertTriangle, Loader2, RefreshCw, Smartphone, Database } from "lucide-react";
import { getEnrollStatus, type EnrollStatus } from "@/lib/webauthn";
import { useAuth } from "@/hooks/use-auth";

/**
 * Pannello di verifica automatica dello stato di enrollment biometrico.
 * Mostra: supporto WebAuthn, credenziale registrata su questo device,
 * presenza nel database (user_devices), n. dispositivi, ultimo uso reale.
 * Si auto-aggiorna ogni 5s.
 */
export function EnrollStatusPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<EnrollStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const s = await getEnrollStatus(user.id);
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh, refreshKey]);
  useEffect(() => {
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  if (!user) return null;

  const fullyEnrolled = !!status?.registeredOnDevice && !!status?.registeredInDb;

  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {fullyEnrolled ? (
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          ) : status?.supported ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          )}
          <h3 className="font-medium">Stato enrollment biometrico</h3>
        </div>
        <button
          onClick={refresh}
          className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Aggiorna
        </button>
      </div>

      <ul className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
        <Row
          icon={<Smartphone className="h-4 w-4" />}
          label="WebAuthn / biometria di sistema"
          ok={!!status?.supported}
          okText="Disponibile (Face ID / Touch ID / impronta)"
          koText="Non rilevato — apri da iPhone/Android"
        />
        <Row
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Credenziale su questo dispositivo"
          ok={!!status?.registeredOnDevice}
          okText="Registrata nell'enclave hardware"
          koText="Da registrare con 'Acquisisci impronta 1'"
        />
        <Row
          icon={<Database className="h-4 w-4" />}
          label="Credenziale nel database"
          ok={!!status?.registeredInDb}
          okText={`Salvata · ${status?.devicesInDb ?? 0} dispositivo/i`}
          koText="Non presente in user_devices"
        />
        <Row
          icon={<RefreshCw className="h-4 w-4" />}
          label="Ultimo uso reale del sensore"
          ok={!!status?.lastUsedAt}
          okText={status?.lastUsedAt ? new Date(status.lastUsedAt).toLocaleString() : ""}
          koText="Mai usato — esegui 'Conferma impronta 2'"
        />
      </ul>

      <p className="mt-4 text-[11px] text-muted-foreground">
        La scansione reale è eseguita dall'OS del telefono (Secure Enclave / TEE). Il template
        biometrico non lascia il device: nel DB salviamo solo l'ID pubblico della credenziale
        e il timestamp d'uso, come prova che il sensore è stato realmente attivato.
      </p>
    </div>
  );
}

function Row({
  icon, label, ok, okText, koText,
}: { icon: React.ReactNode; label: string; ok: boolean; okText: string; koText: string }) {
  return (
    <li className="flex items-start gap-2 p-3 rounded-xl border border-border/60 bg-background">
      <span className={ok ? "text-emerald-600 mt-0.5" : "text-muted-foreground mt-0.5"}>{icon}</span>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={`text-sm ${ok ? "text-foreground" : "text-yellow-700 dark:text-yellow-400"}`}>
          {ok ? okText : koText}
        </div>
      </div>
      <span className={`h-2 w-2 rounded-full mt-2 ${ok ? "bg-emerald-500" : "bg-yellow-500"}`} />
    </li>
  );
}
