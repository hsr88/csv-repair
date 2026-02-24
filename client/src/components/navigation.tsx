import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon, FileSpreadsheet, Info, HelpCircle, Shield } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Badge } from "@/components/ui/badge";

const navLinks = [
  { href: "/about", label: "About", icon: Info },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
];

export function Navigation({ children }: { children?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  return (
    <nav className="flex items-center gap-1.5" data-testid="main-navigation">
      {children}

      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                location === link.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </button>
          </Link>
        ))}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          data-testid="button-theme-toggle"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      <div className="md:hidden relative" ref={menuRef}>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          data-testid="button-hamburger"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {mobileOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-popover-border rounded-lg shadow-xl py-1 z-50" data-testid="mobile-menu">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <button
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                    location === link.href
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </button>
              </Link>
            ))}
            <div className="h-px bg-border my-1" />
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              data-testid="mobile-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export function PageHeader() {
  return (
    <header className="flex items-center justify-between gap-3 px-4 h-14 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-20">
      <Link href="/">
        <div className="flex items-center gap-2 cursor-pointer">
          <FileSpreadsheet className="w-5 h-5 text-blue-400" />
          <span className="text-base font-bold tracking-tight text-foreground">
            csv<span className="text-blue-400">.</span>repair
          </span>
          <Badge variant="secondary" className="no-default-active-elevate text-[10px] uppercase tracking-widest px-1.5 py-0">
            Beta
          </Badge>
        </div>
      </Link>
      <Navigation />
    </header>
  );
}
