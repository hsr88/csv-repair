import { useState, useEffect } from "react";
import { getConsent, setConsent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [visible, setVisible] = useState(() => !getConsent());
  useEffect(() => {
    const open = () => setVisible(true);
    const changed = () => setVisible(!getConsent());
    window.addEventListener("csv-cookie-settings", open);
    window.addEventListener("csv-consent-changed", changed);
    return () => { window.removeEventListener("csv-cookie-settings", open); window.removeEventListener("csv-consent-changed", changed); };
  }, []);
  if (!visible) return null;
  return <section aria-label="Analytics cookies" className="fixed bottom-0 inset-x-0 z-[100] border-t border-border bg-background p-4 shadow-lg">
    <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl text-sm">
        <p className="font-semibold">Help us understand which tools are useful</p>
        <p className="mt-1 text-muted-foreground">With your permission, Google Analytics measures visits, imports, feature use and exports. CSV contents, file names and SQL queries are never sent. The tool works without analytics.</p>
        <a href="/privacy" className="mt-1 inline-block underline underline-offset-2">Privacy policy</a>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button variant="outline" onClick={() => setConsent("declined")}>Decline analytics</Button>
        <Button variant="outline" onClick={() => setConsent("accepted")}>Allow analytics</Button>
      </div>
    </div>
  </section>;
}
