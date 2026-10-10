export const MEASUREMENT_ID = "G-R39FXG3NW8";
export const CONSENT_KEY = "csv-analytics-consent-v2";
type Consent = "accepted" | "declined";
const events = ["tool_opened", "file_selected", "import_completed", "import_error", "import_cancelled", "record_corrected", "feature_used", "export_created"] as const;
type EventName = typeof events[number];
const allowed = {
  feature: ["cell_edit", "structure_edit", "replace", "auto_repair", "template", "sql", "merge", "split", "recipe_save", "recipe_apply"],
  outcome: ["success", "error", "no_changes"],
  export_type: ["editor", "sql", "split"],
  error_category: ["encoding", "structure", "parser"],
  size_bucket: ["under_1mb", "1_10mb", "10_100mb", "100mb_plus"],
  row_bucket: ["0", "1_100", "101_10000", "10001_100000", "100001_plus"],
  column_bucket: ["1_10", "11_50", "51_plus"],
  file_count: ["1", "2_5", "6_plus"],
  duration_bucket: ["under_1s", "1_5s", "5_30s", "30s_plus"],
} as const;
type Params = Partial<{ [K in keyof typeof allowed]: typeof allowed[K][number] }>;
let consent: Consent | null = null;
let started = false;
let lastPage = "";
let initialized = false;
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
const win = () => window as AnalyticsWindow;
const production = () => ["csv.repair", "www.csv.repair"].includes(window.location.hostname);
function disabled(value: boolean) { (window as unknown as Record<string, unknown>)[`ga-disable-${MEASUREMENT_ID}`] = value; }
export function getConsent(): Consent | null {
  if (consent) return consent;
  try { const value = localStorage.getItem(CONSENT_KEY); return value === "accepted" || value === "declined" ? value : consent; } catch { return consent; }
}
function clearCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (!/^_ga(?:_|$)/.test(name)) continue;
    for (const domain of ["", window.location.hostname, ".csv.repair"]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}
function send(...args: unknown[]) {
  try { win().gtag?.(...args); } catch { /* Blocked analytics must not interrupt the editor. */ }
}
function referrerOrigin() { try { return new URL(document.referrer).origin; } catch { return ""; } }
function start() {
  if (started || !production()) return;
  started = true;
  const w = win();
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer!.push(arguments); };
  w.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  w.gtag("js", new Date());
  w.gtag("config", MEASUREMENT_ID, {
    send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
    page_location: window.location.origin + window.location.pathname, page_referrer: referrerOrigin(),
  });
  const script = document.createElement("script");
  script.id = "csv-google-analytics";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}
export function initAnalytics() {
  if (initialized) return;
  initialized = true;
  consent = getConsent();
  disabled(consent !== "accepted");
  if (consent === "accepted") start(); else clearCookies();
  window.addEventListener("storage", event => {
    if (event.key === CONSENT_KEY || event.key === null) {
      consent = null;
      applyConsent(getConsent());
      window.dispatchEvent(new Event("csv-consent-changed"));
    }
  });
}
function applyConsent(value: Consent | null) {
  consent = value;
  disabled(value !== "accepted");
  if (value === "accepted") {
    if (started) send("consent", "update", { analytics_storage: "granted" });
    start();
    trackPage();
  } else {
    lastPage = "";
    // Stop collection before notifying an already loaded tag of withdrawal.
    if (started) send("consent", "update", { analytics_storage: "denied" });
    clearCookies();
  }
}
export function setConsent(value: Consent) {
  try { localStorage.setItem(CONSENT_KEY, value); localStorage.removeItem("cookie-consent"); } catch { /* Keep the choice in memory when storage is unavailable. */ }
  applyConsent(value);
  window.dispatchEvent(new Event("csv-consent-changed"));
}
export function openCookieSettings() { window.dispatchEvent(new Event("csv-cookie-settings")); }
export function track(name: EventName, params: Params = {}) {
  if (getConsent() !== "accepted" || !production() || !events.includes(name)) return;
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (Object.prototype.hasOwnProperty.call(allowed, key) && (allowed[key as keyof Params] as readonly string[]).includes(value)) safe[key] = value;
  }
  try { win().gtag?.("event", name, { ...safe, page_location: window.location.origin + window.location.pathname, page_referrer: referrerOrigin(), send_to: MEASUREMENT_ID }); } catch { /* Analytics must never interrupt CSV operations. */ }
}
export function trackPage() {
  if (getConsent() !== "accepted" || !production()) return;
  const path = window.location.pathname;
  if (path === lastPage) return;
  lastPage = path;
  send("event", "page_view", { page_location: window.location.origin + path, page_referrer: referrerOrigin(), page_title: path === "/" ? "CSV editor" : path, send_to: MEASUREMENT_ID });
  if (path === "/") track("tool_opened");
}
export function tableMetrics(rows: number, columns: number): Params {
  return { row_bucket: rows === 0 ? "0" : rows <= 100 ? "1_100" : rows <= 10000 ? "101_10000" : rows <= 100000 ? "10001_100000" : "100001_plus", column_bucket: columns <= 10 ? "1_10" : columns <= 50 ? "11_50" : "51_plus" };
}
export function fileMetrics(files: { size: number }[]): Params {
  const bytes = files.reduce((sum, f) => sum + f.size, 0);
  return { size_bucket: bytes < 1048576 ? "under_1mb" : bytes < 10485760 ? "1_10mb" : bytes < 104857600 ? "10_100mb" : "100mb_plus", file_count: files.length === 1 ? "1" : files.length <= 5 ? "2_5" : "6_plus" };
}
export function durationMetrics(ms: number): Params { return { duration_bucket: ms < 1000 ? "under_1s" : ms < 5000 ? "1_5s" : ms < 30000 ? "5_30s" : "30s_plus" }; }
