export function repairTemplateValue(kind: string, raw: string): string {
  const value = raw.trim();
  if (kind === "lowercase-emails" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return value.toLowerCase();
  if (kind === "trim-urls" && /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value)) return value.replace(/\/+$/, "");
  // Require phone punctuation: plain numeric IDs must never be normalized.
  if (kind === "normalize-phones" && /^[+\d\s().-]+$/.test(value) && /[+().\s-]/.test(value) && (value.match(/\d/g)?.length ?? 0) >= 7 && (value.match(/\d/g)?.length ?? 0) <= 15 && !/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(value)) {
    return (value.startsWith("+") ? "+" : "") + value.replace(/\D/g, "");
  }
  if (kind === "standardize-dates") {
    // Year-first calendar dates are unambiguous; do not guess day/month order or shift time zones.
    const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(value);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00Z`);
      if (!isNaN(date.getTime()) && date.getUTCMonth() + 1 === Number(month) && date.getUTCDate() === Number(day)) return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  return raw;
}
