import { Link } from "@tanstack/react-router";
import logo from "@/assets/fingerpay-logo.jpg";

export function SiteNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 glass">
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-foreground/90 p-1 flex items-center justify-center">
            <img src={logo} alt="FingerPay" className="h-full w-full object-contain invert" />
          </div>
          <span className="font-display text-xl tracking-tight text-foreground">FingerPay</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/technology" className="hover:text-gold transition">Tecnologia</Link>
          <Link to="/security" className="hover:text-gold transition">Sicurezza</Link>
          <Link to="/merchants" className="hover:text-gold transition">Merchant</Link>
          <Link to="/roadmap" className="hover:text-gold transition">Roadmap</Link>
          <Link to="/investors" className="hover:text-gold transition">Investitori</Link>
        </div>
        <Link
          to="/merchants"
          className="px-4 py-2 text-sm rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition"
        >
          Dashboard
        </Link>
      </nav>
    </header>
  );
}
