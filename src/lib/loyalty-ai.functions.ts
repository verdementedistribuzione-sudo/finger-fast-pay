import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LoyaltyAIResult = {
  brand: string | null;
  card_type: "fidelity" | "membership" | "gift" | "ticket" | "badge" | null;
  card_number: string | null;
  barcode_value: string | null;
  barcode_type: string | null;
  expires_at: string | null;
  holder: string | null;
  color: string | null;
  notes: string | null;
};

const PROMPT = `Analizza la foto di una tessera (fedeltà, membership, gift card, biglietto o badge).
Rispondi SOLO con un oggetto JSON, senza testo extra, con queste chiavi (usa null se non visibile):
{"brand": string, "card_type": "fidelity"|"membership"|"gift"|"ticket"|"badge", "card_number": string,
"barcode_value": string, "barcode_type": "QR_CODE"|"EAN_13"|"CODE_128"|"PDF_417"|"AZTEC"|null,
"expires_at": "YYYY-MM-DD", "holder": string, "color": "#rrggbb" (colore dominante), "notes": string breve}`;

export const recognizeLoyaltyCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { image: string }) => {
    if (typeof input?.image !== "string" || !input.image.startsWith("data:image/")) throw new Error("Immagine non valida");
    if (input.image.length > 8_000_000) throw new Error("Immagine troppo grande");
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("AI non configurata");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const provider = createOpenAI({
      apiKey,
    });
    const result = streamText({
      model: provider(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
      messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image", image: data.image }] }],
    });
    let text: string;
    try {
      text = await result.text;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 402) throw new Error("Crediti AI esauriti");
      if (status === 429) throw new Error("Troppe richieste, riprova tra poco");
      throw new Error("Riconoscimento AI non riuscito");
    }
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Nessun dato riconosciuto");
    return JSON.parse(m[0]) as LoyaltyAIResult;
  });
