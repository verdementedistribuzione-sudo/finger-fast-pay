import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Loader2, X, Camera, CreditCard, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ocrCard } from "@/lib/card-ocr";

export const Route = createFileRoute("/_app/cards")({
  component: CardsPage,
  head: () => ({ meta: [{ title: "Carte · FingerPay" }] }),
});

type Card = {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  holder: string;
};

function detectBrand(pan: string) {
  const n = pan.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(6011|65|64[4-9])/.test(n)) return "Discover";
  return "Card";
}

async function encryptForUser(plain: string, userId: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode("fp:" + userId)),
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));
  return { encrypted_pan: b64(ct), iv: b64(iv.buffer) };
}

function CardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [adding, setAdding] = useState(false);

  async function load() {
    const { data } = await supabase.from("payment_cards").select("*").order("created_at", { ascending: false });
    setCards((data || []) as Card[]);
  }

  useEffect(() => { if (user) load(); }, [user]);

  async function remove(c: Card) {
    if (!confirm("Eliminare la carta •••• " + c.last4 + "?")) return;
    await supabase.from("payment_cards").delete().eq("id", c.id);
    toast.success("Carta rimossa");
    load();
  }

  return (
    <div>
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Metodi di pagamento</div>
          <h1 className="mt-2 text-4xl font-display">Le tue carte</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg">
            Il numero completo della carta viene <strong>cifrato sul tuo dispositivo</strong> prima
            di essere salvato. FingerPay archivia solo brand, ultime 4 cifre e scadenza in chiaro.
            Il CVV non viene mai salvato.
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium shadow-gold">
          <Plus className="h-4 w-4" /> Scansiona carta
        </button>
      </header>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {cards.length === 0 && (
          <div className="col-span-full p-8 rounded-2xl border border-dashed border-border text-center text-muted-foreground">
            Nessuna carta. Aggiungine una per pagare con FingerPay.
          </div>
        )}
        {cards.map((c) => (
          <div key={c.id} className="p-6 rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 text-background relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-gold opacity-30 blur-2xl" />
            <div className="flex items-center justify-between relative">
              <span className="text-xs uppercase tracking-widest opacity-60">{c.brand}</span>
              <button onClick={() => remove(c)} className="opacity-60 hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-12 font-mono text-2xl tracking-widest relative">
              •••• •••• •••• {c.last4}
            </div>
            <div className="mt-6 flex justify-between text-xs uppercase relative">
              <div>
                <div className="opacity-50">Titolare</div>
                <div>{c.holder}</div>
              </div>
              <div>
                <div className="opacity-50">Scadenza</div>
                <div>{String(c.exp_month).padStart(2, "0")}/{String(c.exp_year).slice(-2)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {adding && <AddCardModal onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load(); }} userId={user!.id} />}
    </div>
  );
}

function AddCardModal({ onClose, onAdded, userId }: { onClose: () => void; onAdded: () => void; userId: string }) {
  const [pan, setPan] = useState("");
  const [holder, setHolder] = useState("");
  const [exp, setExp] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const cameraRef = useRef<HTMLInputElement>(null);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPhoto(dataUrl);
      setScanning(true);
      setScanProgress(0);
      try {
        const result = await ocrCard(dataUrl, (p) => setScanProgress(p));
        let filled = 0;
        if (result.pan) { setPan(result.pan.replace(/(\d{4})/g, "$1 ").trim()); filled++; }
        if (result.exp) { setExp(result.exp); filled++; }
        if (result.holder) { setHolder(result.holder); filled++; }
        if (filled > 0) toast.success(`OCR: ${filled} campo/i rilevati. Verifica e correggi.`);
        else toast.warning("OCR non riuscito. Compila a mano guardando la carta.");
      } catch (err) {
        toast.error("Errore OCR: " + (err as Error).message);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(f);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const clean = pan.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(clean)) return toast.error("Numero carta non valido");
    if (!/^\d{2}\/\d{2}$/.test(exp)) return toast.error("Scadenza MM/AA");
    setLoading(true);
    try {
      const [mm, yy] = exp.split("/");
      const enc = await encryptForUser(clean, userId);
      const { error } = await supabase.from("payment_cards").insert({
        user_id: userId,
        brand: detectBrand(clean),
        last4: clean.slice(-4),
        exp_month: Number(mm),
        exp_year: 2000 + Number(yy),
        holder: holder.toUpperCase(),
        ...enc,
      });
      if (error) throw error;
      toast.success("Carta salvata in modo sicuro");
      onAdded();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground"><X className="h-4 w-4" /></button>
        <h3 className="font-display text-2xl">Nuova carta</h3>

        <button type="button" onClick={() => cameraRef.current?.click()}
          className="mt-5 w-full h-32 rounded-xl border border-dashed border-border hover:border-gold flex flex-col items-center justify-center gap-2 text-sm relative overflow-hidden">
          {photo ? (
            <>
              <img src={photo} alt="card" className="absolute inset-0 w-full h-full object-cover" />
              {scanning && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-2">
                  <ScanLine className="h-6 w-6 animate-pulse" />
                  <span className="text-xs">Lettura OCR… {Math.round(scanProgress * 100)}%</span>
                </div>
              )}
            </>
          ) : (
            <>
              <Camera className="h-6 w-6" />
              <span>Scatta foto della carta</span>
              <span className="text-xs text-muted-foreground">OCR automatico sul dispositivo</span>
            </>
          )}
        </button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />

        <form onSubmit={save} className="mt-5 space-y-3">
          <CardField label="Numero carta" value={pan} onChange={(v) => setPan(v.replace(/[^\d\s]/g, "").slice(0, 23))} placeholder="•••• •••• •••• ••••" />
          <CardField label="Titolare" value={holder} onChange={setHolder} placeholder="MARIO ROSSI" />
          <CardField label="Scadenza MM/AA" value={exp} onChange={(v) => setExp(v.replace(/[^\d/]/g, "").slice(0, 5))} placeholder="04/29" />
          <button disabled={loading} className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <CreditCard className="h-4 w-4" /> Salva carta cifrata
          </button>
        </form>
      </div>
    </div>
  );
}

function CardField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full h-11 px-4 rounded-xl border border-border bg-background font-mono" />
    </label>
  );
}
