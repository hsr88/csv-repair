import Papa from "papaparse";

export type CsvRow = Record<string, string>;
export interface CsvTable { headers: string[]; data: CsvRow[] }
export interface ImportOptions { delimiter: string; encoding: string; header: boolean }
export const defaultImportOptions: ImportOptions = { delimiter: "", encoding: "utf-8", header: true };
export interface RecordIssue {
  record: number;
  start: number;
  end: number;
  raw: string;
  message: string;
  suggestion: string;
}
export interface ImportResult extends CsvTable {
  delimiter: string;
  issues: RecordIssue[];
  issueCount: number;
  recordCount: number;
}

export function parseImport(source: string, options: ImportOptions): ImportResult {
  // Papa strips the BOM. Keep offsets relative to the same normalized source.
  const text = source.replace(/^\uFEFF/, "");
  const data: CsvRow[] = [];
  const issues: RecordIssue[] = [];
  let headers: string[] = [];
  let cursor = 0;
  let record = 0;
  let issueCount = 0;
  let delimiter = options.delimiter || Papa.parse(text, { preview: 10, skipEmptyLines: true }).meta.delimiter || ",";
  Papa.parse<string[]>(text, {
    delimiter,
    skipEmptyLines: false,
    step(result) {
      const start = cursor;
      cursor = result.meta.cursor;
      const raw = text.slice(start, cursor);
      if (!raw || /^\s*$/.test(raw)) return;
      record++;
      delimiter = result.meta.delimiter;
      const fields = result.data;
      const messages = result.errors.filter(e => e.code !== "UndetectableDelimiter").map(e => e.message);
      const isHeader = record === 1 && options.header;
      if (record === 1) {
        headers = options.header ? fields : fields.map((_, i) => `Column ${i + 1}`);
        if (options.header && (headers.some(h => !h.trim()) || new Set(headers).size !== headers.length)) {
          messages.push("Headers must be non-empty and unique. Edit this header record or turn off the header option.");
        }
      }
      if (!isHeader && fields.length !== headers.length) {
        messages.push(`Expected ${headers.length} fields; found ${fields.length}. Check missing separators and unquoted delimiters.`);
      }
      if (messages.length) {
        issueCount++;
        if (issues.length < 100) {
          const suggestion = !isHeader && !result.errors.length && fields.length < headers.length
            ? Papa.unparse([fields.concat(Array(headers.length - fields.length).fill(""))], { delimiter, quotes: true })
            : raw.replace(/\r?\n$/, "");
          issues.push({ record, start, end: cursor, raw, message: messages.join(" "), suggestion });
        }
      }
      if (!isHeader && !messages.length) {
        data.push(Object.fromEntries(headers.map((h, i) => [h, fields[i]])));
      }
    },
  });
  if (!record) throw new Error("This file has no CSV records.");
  return { headers, data, delimiter, issues, issueCount, recordCount: Math.max(0, record - (options.header ? 1 : 0)) };
}

export function replaceRecord(source: string, issue: RecordIssue, replacement: string): string {
  if (!replacement.trim()) throw new Error("Enter a corrected record. A repair cannot silently delete a record.");
  const text = source.replace(/^\uFEFF/, "");
  const ending = issue.raw.endsWith("\r\n") ? "\r\n" : issue.raw.endsWith("\n") ? "\n" : issue.raw.endsWith("\r") ? "\r" : "";
  return text.slice(0, issue.start) + replacement.replace(/[\r\n]+$/, "") + ending + text.slice(issue.end);
}

export function mergeTables(tables: CsvTable[]): CsvTable {
  if (!tables.length) throw new Error("Choose at least one file to merge.");
  const headers = Array.from(new Set(tables.flatMap(t => t.headers)));
  if (!headers.length) throw new Error("No columns to merge.");
  return { headers, data: tables.flatMap(t => t.data.map(row => Object.fromEntries(headers.map(h => [h, (Object.prototype.hasOwnProperty.call(row, h) ? row[h] : "")])))) };
}

export function splitRanges(rowCount: number, perFile: number): { start: number; end: number }[] {
  if (!Number.isSafeInteger(perFile) || perFile < 1) throw new Error("Rows per file must be a positive whole number.");
  const count = Math.ceil(rowCount / perFile);
  if (count > 1000) throw new Error("Choose more rows per file to create at most 1,000 parts.");
  return Array.from({ length: count }, (_, i) => ({ start: i * perFile, end: Math.min((i + 1) * perFile, rowCount) }));
}

export function serializeCsv(table: CsvTable, delimiter = ",", bom = false): string {
  const csv = Papa.unparse({ fields: table.headers, data: table.data.map(row => table.headers.map(h => (Object.prototype.hasOwnProperty.call(row, h) ? row[h] : ""))) }, { delimiter, quotes: true });
  return (bom ? "\uFEFF" : "") + csv;
}

export function downloadCsv(table: CsvTable, filename: string, delimiter = ",", bom = false) {
  const url = URL.createObjectURL(new Blob([serializeCsv(table, delimiter, bom)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface RepairStep { kind: "trim" | "remove-empty" | "deduplicate" | "lowercase"; column?: string }
export interface RepairRecipe { id: string; name: string; steps: RepairStep[] }
export function applyRecipe(table: CsvTable, steps: RepairStep[]): CsvTable {
  let data = table.data.map(row => ({ ...row }));
  for (const step of steps) {
    if (step.column && !table.headers.includes(step.column)) throw new Error(`Column "${step.column}" is missing. No changes were applied.`);
    const columns = step.column ? [step.column] : table.headers;
    switch (step.kind) {
      case "trim": data = data.map(row => ({ ...row, ...Object.fromEntries(columns.map(h => [h, ((Object.prototype.hasOwnProperty.call(row, h) ? row[h] : "")).trim()])) })); break;
      case "lowercase":
        if (!step.column) throw new Error("Choose a column for lowercase conversion.");
        data = data.map(row => ({ ...row, [step.column!]: (row[step.column!] ?? "").toLowerCase() })); break;
      case "remove-empty": data = data.filter(row => !table.headers.every(h => !((Object.prototype.hasOwnProperty.call(row, h) ? row[h] : "")).trim())); break;
      case "deduplicate": {
        const seen = new Set<string>();
        data = data.filter(row => { const key = JSON.stringify(columns.map(h => (Object.prototype.hasOwnProperty.call(row, h) ? row[h] : ""))); if (seen.has(key)) return false; seen.add(key); return true; });
        break;
      }
      default: throw new Error("Unsupported repair step.");
    }
  }
  return { headers: [...table.headers], data };
}

export function readRecipes(raw: string | null): RepairRecipe[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.length > 100) throw new Error("Invalid saved repair sets.");
  return value.map(recipe => {
    if (!recipe || typeof recipe.id !== "string" || typeof recipe.name !== "string" || !recipe.name.trim() || !Array.isArray(recipe.steps) || !recipe.steps.length || recipe.steps.length > 30) throw new Error("Invalid saved repair set.");
    for (const step of recipe.steps) {
      if (!step || !["trim", "remove-empty", "deduplicate", "lowercase"].includes(step.kind) || (step.column !== undefined && typeof step.column !== "string") || (step.kind === "lowercase" && !step.column)) throw new Error("Invalid saved repair step.");
    }
    return { id: recipe.id, name: recipe.name, steps: recipe.steps };
  });
}
