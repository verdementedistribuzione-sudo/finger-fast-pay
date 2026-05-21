import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, X, ScanLine, Maximize2, Ticket, BadgeCheck, Gift, IdCard, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";
import { dominantColor, guessLogoUrl } from "@/lib/dominant-color";

export const Route = createFileRoute("/_app/loyalty")({
  component: LoyaltyPage,
  head: () => ({ meta: [{ title: "Wallet Fedeltà · FingerPay" }] }),
});

type Loyalty = {
  id: string;
  card_type: string;
  brand: string;
  card_number: string;
  barcode_type: string;
  barcode_value: string;
  color: string | null;
  logo_url: string | null;
  expires_at: string | null;
  notes: string | null;
};

const CARD_TYPES = [
  { id: "fidelity", label: "Fedeltà", icon: Sparkles },
  { id: "membership", label: "Tessera", icon: IdCard },
  { id: "gift", label: "Gift card", icon: Gift },
  { id: "ticket", label: "Biglietto", icon: Ticket },
  { id: "badge", label: "Badge", icon: BadgeCheck },
];

const COLORS = [
  "#0f172a", "#1e3a8a", "#1d4ed8", "#0369a1", "#0e7490", "#065f46", "#15803d", "#65a30d",
  "#ca8a04", "#b45309", "#c2410c", "#dc2626", "#be123c", "#831843", "#a21caf", "#7e22ce",
  "#4c1d95", "#3730a3", "#78350f", "#164e63", "#374151", "#111827", "#7c2d12", "#3b0764",
];

function LoyaltyPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Loyalty[]>([]);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<Loyalty | null>(null);

  async function load() {
    const { data } = await supabase.from("loyalty_cards").select("*").order("created_at", { ascending: false });
    setItems((data || []) as Loyalty[]);
  }
  useEffect(() => { if (user) load(); }, [user]);

  async function remove(c: Loyalty) {
    if (!confirm("Eliminare la tessera " + c.brand + "?")) return;
    await supabase.from("loyalty_cards").delete().eq("id", c.id);
    toast.success("Tessera rimossa");
    load();
  }

  return (
    <div>
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Wallet fedeltà</div>
          <h1 className="mt-2 text-4xl font-display">Tessere & biglietti</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg">
            Scansiona il barcode o QR delle tue tessere. Tutto resta sul dispositivo, niente
            immagini caricate sul server.
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium shadow-gold">
          <Plus className="h-4 w-4" /> Nuova tessera
        </button>
      </header>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {items.length === 0 && (
          <div className="col-span-full p-8 rounded-2xl border border-dashed border-border text-center text-muted-foreground">
            Nessuna tessera. Scansiona il primo barcode.
          </div>
        )}
        {items.map((c) => (
          <button key={c.id} onClick={() => setViewing(c)}
            className="text-left p-6 rounded-2xl relative overflow-hidden text-white"
            style={{ background: `linear-gradient(135deg, ${c.color || "#0f172a"}, ${c.color || "#0f172a"}cc)` }}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest opacity-70">{c.card_type}</span>
              <span onClick={(e) => { e.stopPropagation(); remove(c); }} className="opacity-60 hover:opacity-100 cursor-pointer">
                <Trash2 className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-6 flex items-center gap-3">
              {c.logo_url && (
                <img src={c.logo_url} alt="" onError={(e) => ((e.currentTarget.style.display = "none"))}
                  className="h-10 w-10 rounded-lg bg-white/90 object-contain p-1" />
              )}
              <div>
                <div className="text-2xl font-display leading-tight">{c.brand}</div>
                <div className="mt-1 font-mono text-sm opacity-80">{c.card_number}</div>
              </div>
            </div>
            <div className="mt-5">
              <BarcodeDisplay value={c.barcode_value} format={c.barcode_type} height={50} />
            </div>
            <div className="mt-3 flex justify-between text-[10px] uppercase opacity-70">
              <span>{c.barcode_type}</span>
              {c.expires_at && <span>Scad. {c.expires_at}</span>}
            </div>
          </button>
        ))}
      </div>

      {adding && (
        <AddLoyaltyModal
          userId={user!.id}
          onClose={() => setAdding(false)}
          onAdded={() => { setAdding(false); load(); }}
        />
      )}
      {viewing && <FullscreenCard card={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function AddLoyaltyModal({ userId, onClose, onAdded }: { userId: string; onClose: () => void; onAdded: () => void }) {
  const [scanning, setScanning] = useState(true);
  const [scanned, setScanned] = useState<ScanResult | null>(null);
  const [cardType, setCardType] = useState("fidelity");
  const [brand, setBrand] = useState("");
  const [number, setNumber] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [expires, setExpires] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function onScan(r: ScanResult) {
    setScanned(r);
    setNumber(r.value);
    setScanning(false);
    toast.success(`Codice ${r.format} rilevato`);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!brand.trim() || !number.trim()) return toast.error("Brand e numero tessera obbligatori");
    setSaving(true);
    try {
      const { error } = await supabase.from("loyalty_cards").insert({
        user_id: userId,
        card_type: cardType,
        brand: brand.trim(),
        card_number: number.trim(),
        barcode_type: scanned?.format || "CODE128",
        barcode_value: scanned?.value || number.trim(),
        color,
        expires_at: expires || null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      toast.success("Tessera salvata");
      onAdded();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (scanning) {
    return (
      <BarcodeScanner
        onResult={onScan}
        onClose={() => setScanning(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground"><X className="h-4 w-4" /></button>
        <h3 className="font-display text-2xl">Nuova tessera</h3>

        {scanned ? (
          <div className="mt-4 p-3 rounded-xl bg-secondary text-xs">
            <div className="text-muted-foreground">Codice rilevato ({scanned.format})</div>
            <div className="font-mono mt-1 break-all">{scanned.value}</div>
          </div>
        ) : (
          <button type="button" onClick={() => setScanning(true)}
            className="mt-4 w-full h-24 rounded-xl border border-dashed border-border hover:border-gold flex flex-col items-center justify-center gap-2 text-sm">
            <ScanLine className="h-6 w-6" />
            Scansiona barcode o QR
          </button>
        )}

        <form onSubmit={save} className="mt-5 space-y-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Tipo</span>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {CARD_TYPES.map((t) => (
                <button type="button" key={t.id} onClick={() => setCardType(t.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] border ${
                    cardType === t.id ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"
                  }`}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Brand" value={brand} onChange={setBrand} placeholder="Esselunga, Decathlon…" />
          <Field label="Numero tessera" value={number} onChange={setNumber} mono />
          <Field label="Scadenza (opzionale)" value={expires} onChange={setExpires} placeholder="YYYY-MM-DD" />
          <Field label="Note" value={notes} onChange={setNotes} placeholder="" />

          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Colore</span>
            <div className="mt-2 flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-gold" : "border-transparent"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <button disabled={saving} className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold">
            {saving ? "Salvataggio…" : "Salva tessera"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`mt-1 w-full h-11 px-4 rounded-xl border border-border bg-background ${mono ? "font-mono" : ""}`} />
    </label>
  );
}

function FullscreenCard({ card, onClose }: { card: Loyalty; onClose: () => void }) {
  useEffect(() => {
    // Try to bump display brightness via wake lock + fullscreen
    let wakeLock: { release: () => Promise<void> } | null = null;
    (async () => {
      try {
        wakeLock = await (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen") ?? null;
      } catch {/* */}
    })();
    return () => { wakeLock?.release().catch(() => {}); };
  }, []);

  async function fullscreen() {
    try { await document.documentElement.requestFullscreen(); } catch {/* */}
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-6 text-white"
      style={{ background: card.color || "#0f172a" }}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2"><X className="h-5 w-5" /></button>
      <button onClick={fullscreen} className="absolute top-4 left-4 p-2"><Maximize2 className="h-5 w-5" /></button>

      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-widest opacity-70">{card.card_type}</div>
        <h2 className="text-3xl font-display mt-1">{card.brand}</h2>
      </div>

      <div className="w-full max-w-md">
        <BarcodeDisplay value={card.barcode_value} format={card.barcode_type} height={180} />
      </div>

      <div className="mt-6 font-mono text-lg tracking-widest">{card.card_number}</div>
      <div className="mt-2 text-xs uppercase opacity-70">{card.barcode_type}</div>
      {card.expires_at && <div className="mt-1 text-xs opacity-70">Scade {card.expires_at}</div>}
      {card.notes && <div className="mt-4 text-sm opacity-80 max-w-md text-center">{card.notes}</div>}
    </div>
  );
}
