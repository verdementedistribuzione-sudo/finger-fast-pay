import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, FileText, Image as ImageIcon, Trash2, Download, Loader2, X, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/wallet")({
  component: WalletPage,
  head: () => ({ meta: [{ title: "Wallet · FingerPay" }] }),
});

type Doc = {
  id: string;
  doc_type: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  created_at: string;
};

type Tx = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  merchant: string | null;
  created_at: string;
};

type AuditRow = {
  id: string;
  step: string;
  method: string;
  outcome: string;
  reason: string | null;
  created_at: string;
};

const DOC_TYPES = [
  { v: "id", label: "Documento d'identità" },
  { v: "passport", label: "Passaporto" },
  { v: "ticket", label: "Biglietto" },
  { v: "boarding", label: "Carta d'imbarco" },
  { v: "membership", label: "Tessera" },
  { v: "other", label: "Altro" },
];

function WalletPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [adding, setAdding] = useState(false);

  async function load() {
    if (!user) return;
    const [{ data: d }, { data: t }, { data: a }] = await Promise.all([
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("biometric_audit").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setDocs(d || []);
    setTxs(t || []);
    setAudit((a || []) as AuditRow[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function openDoc(d: Doc) {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(d.storage_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  async function removeDoc(d: Doc) {
    if (!confirm("Eliminare " + d.name + "?")) return;
    await supabase.storage.from("documents").remove([d.storage_path]);
    await supabase.from("documents").delete().eq("id", d.id);
    toast.success("Documento eliminato");
    load();
  }

  return (
    <div>
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Il tuo wallet</div>
          <h1 className="mt-2 text-4xl font-display">Documenti & pagamenti</h1>
        </div>
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium shadow-gold">
          <Plus className="h-4 w-4" /> Aggiungi documento
        </button>
      </header>

      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Documenti ({docs.length})</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.length === 0 && (
            <div className="col-span-full p-8 rounded-2xl border border-dashed border-border text-center text-muted-foreground">
              Nessun documento. Aggiungine uno per iniziare.
            </div>
          )}
          {docs.map((d) => (
            <div key={d.id} className="p-5 rounded-2xl bg-card border border-border group">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-gradient-gold/10 flex items-center justify-center border border-gold/20">
                  {d.mime_type?.startsWith("image/")
                    ? <ImageIcon className="h-5 w-5 text-gold" />
                    : <FileText className="h-5 w-5 text-gold" />}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {DOC_TYPES.find((t) => t.v === d.doc_type)?.label || d.doc_type}
                </span>
              </div>
              <div className="mt-4 font-medium truncate">{d.name}</div>
              <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => openDoc(d)} className="flex-1 text-xs py-2 rounded-lg bg-secondary hover:bg-secondary/80 inline-flex items-center justify-center gap-1">
                  <Download className="h-3 w-3" /> Apri
                </button>
                <button onClick={() => removeDoc(d)} className="text-xs py-2 px-3 rounded-lg bg-secondary hover:bg-red-500/10 hover:text-red-500">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Ultime transazioni</h2>
        <div className="mt-4 rounded-2xl bg-card border border-border overflow-hidden">
          {txs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Nessuna transazione ancora.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {txs.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3">
                      <div className="font-medium">{t.merchant || "Pagamento"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                    </td>
                    <td className="px-5 py-3 text-right font-display">
                      {Number(t.amount).toFixed(2)} {t.currency}
                    </td>
                    <td className="px-5 py-3 pr-6">
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Audit SCA · ultime verifiche</h2>
        <p className="mt-1 text-xs text-muted-foreground">Solo esito e timestamp. Nessun dato biometrico è memorizzato.</p>
        <div className="mt-4 rounded-2xl bg-card border border-border overflow-hidden">
          {audit.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Nessuna verifica registrata.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3 text-xs">{stepLabel(a.step)}</td>
                    <td className="px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">{a.method}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        a.outcome === "success"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                          : "bg-red-500/10 text-red-600 border border-red-500/30"
                      }`}>{a.outcome}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {adding && <AddDocModal onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load(); }} userId={user!.id} />}
    </div>
  );
}

function stepLabel(step: string) {
  switch (step) {
    case "finger_1": return "Dito 1 · identità";
    case "finger_2": return "Dito 2 · autorizzazione";
    case "pin": return "PIN · SCA";
    case "app_fallback": return "App · conferma";
    case "enrollment_1": return "Enrollment dito 1";
    case "enrollment_2": return "Enrollment dito 2";
    default: return step;
  }
}

function AddDocModal({ onClose, onAdded, userId }: { onClose: () => void; onAdded: () => void; userId: string }) {
  const [docType, setDocType] = useState("id");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Seleziona un file");
    setLoading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("documents").insert({
        user_id: userId,
        doc_type: docType,
        name: name || file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (dbErr) throw dbErr;
      toast.success("Documento aggiunto al wallet");
      onAdded();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground"><X className="h-4 w-4" /></button>
        <h3 className="font-display text-2xl">Nuovo documento</h3>
        <form onSubmit={upload} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Tipo</span>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="mt-1 w-full h-11 px-3 rounded-xl border border-border bg-background">
              {DOC_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Nome</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Carta d'identità Mario"
              className="mt-1 w-full h-11 px-4 rounded-xl border border-border bg-background" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => fileInput.current?.click()}
              className="h-20 rounded-xl border border-dashed border-border hover:border-gold hover:text-gold flex flex-col items-center justify-center gap-1 text-xs">
              <FileText className="h-5 w-5" /> Carica PDF / file
            </button>
            <button type="button" onClick={() => cameraInput.current?.click()}
              className="h-20 rounded-xl border border-dashed border-border hover:border-gold hover:text-gold flex flex-col items-center justify-center gap-1 text-xs">
              <Camera className="h-5 w-5" /> Fotografa
            </button>
          </div>
          <input ref={fileInput} type="file" accept="application/pdf,image/*" hidden
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file && <div className="text-xs text-muted-foreground truncate">📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)</div>}
          <button disabled={loading} className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Aggiungi al wallet
          </button>
        </form>
      </div>
    </div>
  );
}
