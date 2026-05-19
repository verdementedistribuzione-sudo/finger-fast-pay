import { LogOut, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

/**
 * Barra account riusabile: ripristino password (via email) + sign out.
 * Visibile sia nel gate di sicurezza sia dentro la pagina di scansione.
 */
export function AccountToolbar({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"reset" | "out" | null>(null);

  async function resetPassword() {
    if (!user?.email) return toast.error("Email non disponibile");
    setLoading("reset");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + "/login",
      });
      if (error) throw error;
      toast.success("Email di ripristino inviata a " + user.email);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function signOut() {
    setLoading("out");
    try {
      await supabase.auth.signOut();
      toast.success("Sessione chiusa");
      navigate({ to: "/login" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={resetPassword}
        disabled={loading !== null}
        className="text-xs px-3 py-1.5 rounded-full bg-secondary text-foreground inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        {loading === "reset" ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
        Ripristina password
      </button>
      <button
        onClick={signOut}
        disabled={loading !== null}
        className="text-xs px-3 py-1.5 rounded-full border border-border text-foreground inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        {loading === "out" ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
        Sign out
      </button>
    </div>
  );
}
