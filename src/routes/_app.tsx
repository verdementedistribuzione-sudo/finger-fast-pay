import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, CreditCard, Fingerprint, LogOut, Home, Bell, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user?.email) return;
    async function load() {
      const { count } = await supabase.from("payment_requests").select("id", { count: "exact", head: true })
        .eq("user_email", user!.email!).eq("status", "pending").gt("expires_at", new Date().toISOString());
      setPendingCount(count || 0);
    }
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [user?.email]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Caricamento…</div>;
  }

  const tabs = [
    { to: "/wallet", icon: Wallet, label: "Wallet" },
    { to: "/cards", icon: CreditCard, label: "Carte" },
    { to: "/pay", icon: Fingerprint, label: "Paga" },
    { to: "/requests", icon: Bell, label: "Richieste", badge: pendingCount },
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
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm transition ${
                  active ? "bg-gradient-gold/10 text-gold border border-gold/20" : "text-muted-foreground hover:bg-secondary"
                }`}>
                <span className="inline-flex items-center gap-3"><t.icon className="h-4 w-4" /> {t.label}</span>
                {!!t.badge && t.badge > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold text-primary-foreground">{t.badge}</span>
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                location.pathname.startsWith("/admin") ? "bg-gradient-gold/10 text-gold border border-gold/20" : "text-muted-foreground hover:bg-secondary"
              }`}>
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
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

      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur z-40">
        <div className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = location.pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to}
                className={`relative flex flex-col items-center gap-1 py-3 text-xs ${active ? "text-gold" : "text-muted-foreground"}`}>
                <t.icon className="h-5 w-5" /> {t.label}
                {!!t.badge && t.badge > 0 && (
                  <span className="absolute top-2 right-4 text-[9px] px-1.5 py-0.5 rounded-full bg-gold text-primary-foreground">{t.badge}</span>
                )}
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
