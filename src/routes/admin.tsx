import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Settings as SettingsIcon, Users, Smartphone, Receipt, Loader2, ArrowLeft, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin · FingerPay" }] }),
});

type Tab = "settings" | "users" | "devices" | "audit" | "sca_audit";

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("settings");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Caricamento…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <Shield className="h-12 w-12 text-gold" />
        <h1 className="mt-4 text-3xl font-display">Accesso riservato</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Questa area è riservata agli amministratori. Il tuo account non ha il ruolo richiesto.
        </p>
        <Link to="/wallet" className="mt-6 px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm">Torna all'app</Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof SettingsIcon }[] = [
    { id: "settings", label: "Soglie SCA", icon: SettingsIcon },
    { id: "users", label: "Utenti", icon: Users },
    { id: "devices", label: "Dispositivi", icon: Smartphone },
    { id: "audit", label: "Transazioni", icon: Receipt },
    { id: "sca_audit", label: "Audit SCA", icon: ScanLine },
  ];

  return (
    <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      <Link to="/wallet" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> App
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <Shield className="h-7 w-7 text-gold" />
        <h1 className="text-4xl font-display">Pannello Admin</h1>
      </div>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm inline-flex items-center gap-2 border-b-2 -mb-px ${
              tab === t.id ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "settings" && <SettingsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "devices" && <DevicesTab />}
        {tab === "audit" && <AuditTab />}
        {tab === "sca_audit" && <ScaAuditTab />}
      </div>
    </div>
  );
}

function SettingsTab() {
  const [threshold, setThreshold] = useState(50);
  const [requirePin, setRequirePin] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) { setThreshold(Number(data.sca_threshold)); setRequirePin(data.require_pin_above_threshold); }
    });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("app_settings").update({
      sca_threshold: threshold, require_pin_above_threshold: requirePin, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Soglie aggiornate");
  }

  return (
    <div className="max-w-lg p-8 rounded-3xl bg-card border border-border space-y-6">
      <div>
        <h2 className="text-xl font-display">Soglia Strong Customer Authentication</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pagamenti sopra soglia richiedono un secondo fattore (PIN o secondo dito).
        </p>
      </div>
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Soglia (EUR)</span>
        <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}
          className="mt-1 w-full h-12 px-4 rounded-xl border border-border bg-background font-display text-2xl" />
      </label>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={requirePin} onChange={(e) => setRequirePin(e.target.checked)} className="mt-1" />
        <span className="text-sm">
          Richiedi <strong>PIN</strong> come secondo fattore (conforme SCA/PSD2: possesso + inherence).
          Se disattivato verrà richiesto un secondo dito (biometria rafforzata, non strettamente 2FA).
        </span>
      </label>
      <button onClick={save} disabled={saving}
        className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium inline-flex items-center justify-center gap-2">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}Salva
      </button>
    </div>
  );
}

function UsersTab() {
  const [rows, setRows] = useState<{ id: string; email: string | null; full_name: string | null; created_at: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id,email,full_name,created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));
    setRows((profiles || []).map((p) => ({ ...p, role: roleMap.get(p.id) || "user" })));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    if (makeAdmin) {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    } else {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    }
    toast.success("Ruolo aggiornato");
    load();
  }

  if (loading) return <div className="text-muted-foreground">Caricamento…</div>;
  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
          <tr><th className="text-left p-4">Nome</th><th className="text-left p-4">Email</th><th className="text-left p-4">Registrato</th><th className="text-left p-4">Ruolo</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-4">{r.full_name || "—"}</td>
              <td className="p-4">{r.email}</td>
              <td className="p-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("it-IT")}</td>
              <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-xs ${r.role === "admin" ? "bg-gold/10 text-gold border border-gold/30" : "bg-secondary text-muted-foreground"}`}>{r.role}</span></td>
              <td className="p-4 text-right">
                <button onClick={() => toggleAdmin(r.id, r.role !== "admin")} className="text-xs text-gold hover:underline">
                  {r.role === "admin" ? "Rimuovi admin" : "Rendi admin"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DevicesTab() {
  const [rows, setRows] = useState<{ id: string; user_id: string; label: string; created_at: string; last_used_at: string | null }[]>([]);
  useEffect(() => {
    supabase.from("user_devices").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setRows((data || []) as typeof rows));
  }, []);
  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
          <tr><th className="text-left p-4">Etichetta</th><th className="text-left p-4">Utente</th><th className="text-left p-4">Registrato</th><th className="text-left p-4">Ultimo uso</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nessun dispositivo registrato.</td></tr>}
          {rows.map((d) => (
            <tr key={d.id} className="border-t border-border">
              <td className="p-4 inline-flex items-center gap-2"><Smartphone className="h-4 w-4 text-gold" />{d.label}</td>
              <td className="p-4 font-mono text-xs text-muted-foreground">{d.user_id.slice(0, 8)}…</td>
              <td className="p-4 text-muted-foreground">{new Date(d.created_at).toLocaleString("it-IT")}</td>
              <td className="p-4 text-muted-foreground">{d.last_used_at ? new Date(d.last_used_at).toLocaleString("it-IT") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditTab() {
  const [rows, setRows] = useState<{ id: string; user_id: string; amount: number; currency: string; status: string; token: string | null; merchant: string | null; created_at: string }[]>([]);
  useEffect(() => {
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows((data || []) as typeof rows));
  }, []);
  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
          <tr><th className="text-left p-4">Data</th><th className="text-left p-4">Utente</th><th className="text-left p-4">Merchant</th><th className="text-right p-4">Importo</th><th className="text-left p-4">Stato</th><th className="text-left p-4">Token</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nessuna transazione.</td></tr>}
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-border">
              <td className="p-4 text-muted-foreground">{new Date(t.created_at).toLocaleString("it-IT")}</td>
              <td className="p-4 font-mono text-xs">{t.user_id.slice(0, 8)}…</td>
              <td className="p-4">{t.merchant || "—"}</td>
              <td className="p-4 text-right font-display">€ {Number(t.amount).toFixed(2)}</td>
              <td className="p-4"><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">{t.status}</span></td>
              <td className="p-4 font-mono text-xs text-muted-foreground">{t.token?.slice(0, 14)}…</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScaAuditTab() {
  type Row = {
    id: string;
    user_id: string;
    transaction_id: string | null;
    step: string;
    method: string;
    outcome: string;
    reason: string | null;
    created_at: string;
  };
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("biometric_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data }) => {
        setRows((data || []) as Row[]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-muted-foreground">Caricamento…</div>;

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border text-xs text-muted-foreground">
        Solo esito e timestamp delle scansioni. <strong>Nessun dato biometrico</strong> è registrato.
      </div>
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="text-left p-4">Quando</th>
            <th className="text-left p-4">Utente</th>
            <th className="text-left p-4">Step</th>
            <th className="text-left p-4">Metodo</th>
            <th className="text-left p-4">Esito</th>
            <th className="text-left p-4">Transazione</th>
            <th className="text-left p-4">Motivo</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-muted-foreground">
                Nessuna verifica registrata.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-4 text-muted-foreground">{new Date(r.created_at).toLocaleString("it-IT")}</td>
              <td className="p-4 font-mono text-xs">{r.user_id.slice(0, 8)}…</td>
              <td className="p-4">{r.step}</td>
              <td className="p-4 uppercase tracking-widest text-xs text-muted-foreground">{r.method}</td>
              <td className="p-4">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    r.outcome === "success"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                      : "bg-red-500/10 text-red-600 border border-red-500/30"
                  }`}
                >
                  {r.outcome}
                </span>
              </td>
              <td className="p-4 font-mono text-xs text-muted-foreground">
                {r.transaction_id ? r.transaction_id.slice(0, 8) + "…" : "—"}
              </td>
              <td className="p-4 text-xs text-muted-foreground">{r.reason || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
