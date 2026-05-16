import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Wallet, CreditCard, Fingerprint, LogOut, Home } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Caricamento…</div>;
  }

  const tabs = [
    { to: "/wallet", icon: Wallet, label: "Wallet" },
    { to: "/cards", icon: CreditCard, label: "Carte" },
    { to: "/pay", icon: Fingerprint, label: "Paga" },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64">
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 border-r border-border bg-card flex-col p-6">
        <Link to="/" className="font-display text-2xl">Finger<span className="text-gold">Pay</span></Link>
        <nav className="mt-10 flex flex-col gap-1">
          {tabs.map((t) => {
            const active = location.pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                  active ? "bg-gradient-gold/10 text-gold border border-gold/20" : "text-muted-foreground hover:bg-secondary"
                }`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2">
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <Home className="h-3 w-3" /> Sito vetrina
          </Link>
          <button onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/login" }))}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <LogOut className="h-3 w-3" /> Esci
          </button>
        </div>
      </aside>

      <main className="px-4 md:px-10 py-8 max-w-5xl mx-auto md:mx-0">
        <Outlet />
      </main>

      {/* mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur z-40">
        <div className="grid grid-cols-4">
          {tabs.map((t) => {
            const active = location.pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to}
                className={`flex flex-col items-center gap-1 py-3 text-xs ${active ? "text-gold" : "text-muted-foreground"}`}>
                <t.icon className="h-5 w-5" /> {t.label}
              </Link>
            );
          })}
          <button onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/login" }))}
            className="flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground">
            <LogOut className="h-5 w-5" /> Esci
          </button>
        </div>
      </nav>
    </div>
  );
}
