import { useEffect } from "react";
import { useLocation } from "wouter";
import { trackPage } from "@/lib/analytics";
import { CookieBanner } from "@/components/cookie-banner";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import CsvRepairPage from "@/pages/csv-repair";
import AboutPage from "@/pages/about";
import FAQPage from "@/pages/faq";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import BlogPage from "@/pages/blog";
import LandingPage from "@/pages/landing-page";
import TableCapturePage from "@/pages/table-capture";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CsvRepairPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/blog/:slug" component={BlogPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/table-capture" component={TableCapturePage} />
      {/* Landing pages for SEO */}
      <Route path="/fix-csv" component={() => <LandingPage slug="fix-csv" />} />
      <Route path="/repair-csv-file-online" component={() => <LandingPage slug="repair-csv-file-online" />} />
      <Route path="/csv-fix" component={() => <LandingPage slug="csv-fix" />} />
      <Route path="/fix-broken-csv" component={() => <LandingPage slug="fix-broken-csv" />} />
      <Route path="/csv-repair-tool" component={() => <LandingPage slug="csv-repair-tool" />} />
      <Route path="/csv-too-big-for-excel" component={() => <LandingPage slug="csv-too-big-for-excel" />} />
      <Route path="/fix-csv-encoding" component={() => <LandingPage slug="fix-csv-encoding" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  useEffect(() => { trackPage(); }, [location]);
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieBanner />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
