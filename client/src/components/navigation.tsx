import { openCookieSettings } from "@/lib/analytics";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon, FileSpreadsheet, Info, HelpCircle, Shield, Heart, Github, BookOpen, TableProperties } from "lucide-react";
import { useTheme } from "./theme-provider";
import { ChromeLogo } from "./chrome-logo";

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
      <button onClick={openCookieSettings} aria-label="Cookie settings" title="Cookie settings" className="rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"><Shield className="h-4 w-4" /></button>

      <Link
        href="/table-capture"
        className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${location === "/table-capture"
          ? "border-blue-400 bg-blue-100 text-blue-950 dark:border-blue-400/60 dark:bg-blue-500/20 dark:text-blue-100"
          : "border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-400 hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:border-blue-400/60 dark:hover:bg-blue-500/20"
        }`}
        data-testid="nav-capture-tables"
        title="Table Capture: capture web tables with our Chrome extension"
        aria-current={location === "/table-capture" ? "page" : undefined}
      >
        <ChromeLogo className="h-5 w-5 shrink-0" />
        <span className="whitespace-nowrap"><span className="hidden sm:inline">Chrome </span>extension</span>
      </Link>

      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${location === link.href
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
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${location === link.href
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
            <div className="h-px bg-border my-1" />
            <Link href="/blog">
              <button
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${location === "/blog"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                data-testid="mobile-nav-blog"
              >
                <BookOpen className="w-4 h-4" />
                Blog
              </button>
            </Link>
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
          <span className="hidden lg:inline text-xs text-muted-foreground ml-1">- Your broken CSV ends here.</span>
        </div>
      </Link>
      <Navigation />
    </header>
  );
}

export function PageFooter() {
  return (
    <footer className="hidden md:block border-t border-border bg-card/50 backdrop-blur-sm flex-shrink-0" data-testid="page-footer">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>
              csv<span className="text-blue-400">.</span>repair
            </span>
            <span className="mx-1">·</span>
            <span>&copy; {new Date().getFullYear()} - A free CSV file repair tool.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/table-capture">
              <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer whitespace-nowrap" data-testid="footer-table-capture">
                <TableProperties className="w-3.5 h-3.5 text-cyan-500" />
                Capture tables
              </span>
            </Link>
            <Link href="/blog">
              <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer" data-testid="footer-blog">
                <BookOpen className="w-3.5 h-3.5" />
                Blog
              </span>
            </Link>
            <a
              href="https://github.com/hsr88/csv-repair"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors"
              data-testid="footer-repo"
            >
              <Github className="w-3.5 h-3.5" />
              Repository
            </a>
            <a
              href="https://ko-fi.com/hsr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors font-medium"
              data-testid="footer-kofi"
            >
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
