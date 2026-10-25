import { importErrorMessage, type ImportErrorReason } from "@/lib/csv-import-errors";
import { track, fileMetrics, tableMetrics, durationMetrics } from "@/lib/analytics";
import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { defaultImportOptions, type CsvTable, type ImportOptions, type ImportResult, type RecordIssue } from "@/lib/csv-workflows";

const fieldClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function RecordRepair({ issue, onApply }: { issue: RecordIssue; onApply: (value: string) => void }) {
  const [value, setValue] = useState(issue.suggestion);
  return (
    <div className="space-y-3 rounded-md border border-destructive/40 p-3">
      <p className="text-sm font-semibold">Record {issue.record}</p>
      <p className="text-sm text-muted-foreground">{issue.message}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">Original record<textarea readOnly value={issue.raw} className={`${fieldClass} min-h-28 font-mono`} /></label>
        <label className="space-y-1 text-sm">Proposed correction<textarea value={value} onChange={e => setValue(e.target.value)} className={`${fieldClass} min-h-28 font-mono`} /></label>
      </div>
      <p className="text-xs text-muted-foreground">{issue.kind === "header" ? "Each column needs a unique name. The suggestion renames duplicate or empty headers and preserves every column. Review the names before applying." : "Short records are suggested with empty fields at the end. Check where the missing value belongs. Quote errors may include several records: restore their intended boundaries."}</p>
      <Button size="sm" disabled={!value.trim() || value === issue.raw} onClick={() => onApply(value)}>Apply correction to preview</Button>
    </div>
  );
}

export function CsvImportDialog({ files, baseTable, onClose, onImport }: {
  files: File[];
  baseTable?: CsvTable;
  onClose: () => void;
  onImport: (table: CsvTable, delimiter: string, filename: string) => void;
}) {
  const [options, setOptions] = useState<ImportOptions>(defaultImportOptions);
  const [changed, setChanged] = useState<boolean[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(true);
  const [progress, setProgress] = useState({ phase: "reading", index: 0, percent: 0, records: 0 });
  const [reason, setReason] = useState<ImportErrorReason | "">("");
  const workerRef = useRef<Worker | null>(null);
  const completion = useRef(onImport);
  completion.current = onImport;
  const [error, setError] = useState("");
  const [includeCurrent, setIncludeCurrent] = useState(!!baseTable);
  const [revision, setRevision] = useState(0);
  const startedAt = useRef(performance.now());
  const reportedErrors = useRef(new Set<string>());
  const selectedOnce = useRef(false);
  const finished = useRef(false);
  const reportError = (category: "encoding" | "structure" | "parser", error_reason: ImportErrorReason) => {
    if (reportedErrors.current.has(error_reason)) return;
    reportedErrors.current.add(error_reason);
    track("import_error", { error_category: category, error_reason, ...fileMetrics(files) });
  };
  const cancel = () => {
    if (!finished.current) {
      finished.current = true;
      track("import_cancelled", { ...fileMetrics(files), ...durationMetrics(performance.now() - startedAt.current) });
    }
    onClose();
  };
  useEffect(() => {
    if (!selectedOnce.current) { selectedOnce.current = true; track("file_selected", fileMetrics(files)); }
  }, [files]);

  const fail = (failure: ImportErrorReason, index = 0) => {
    setBusy(false); setReason(failure); setSelected(index);
    setError(importErrorMessage(failure));
    reportError(failure === "decode" ? "encoding" : "parser", failure);
  };
  const createWorker = (settings: ImportOptions) => {
    workerRef.current?.terminate();
    try {
      const worker = new Worker(new URL("../lib/csv-import.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = ({ data }) => {
        if (workerRef.current !== worker || finished.current) return;
        if (data.type === "progress") setProgress(data);
        else if (data.type === "preview") {
          setResults(data.results); setChanged(data.changed); setBusy(false); setRevision(r => r + 1);
          if (data.results.some((r: ImportResult) => r.issueCount > 0)) reportError("structure", "record_structure");
        } else if (data.type === "error") fail(data.reason, data.index);
        else if (data.type === "complete") {
          const table: CsvTable = data.table;
          completion.current(table, data.delimiter, data.merged ? "merged.csv" : files[0].name);
          finished.current = true;
          track("import_completed", { ...fileMetrics(files), ...tableMetrics(table.data.length, table.headers.length), ...durationMetrics(performance.now() - startedAt.current) });
          if (data.merged) track("feature_used", { feature: "merge", outcome: "success", ...tableMetrics(table.data.length, table.headers.length) });
          worker.terminate(); workerRef.current = null;
        }
      };
      worker.onerror = () => { if (workerRef.current === worker) { worker.terminate(); workerRef.current = null; fail("worker_failed"); } };
      worker.onmessageerror = () => { if (workerRef.current === worker) { worker.terminate(); workerRef.current = null; fail("transfer_failed"); } };
      worker.postMessage({ type: "load", files, options: settings });
    } catch { workerRef.current?.terminate(); workerRef.current = null; fail("worker_failed"); }
  };
  const request = (command: object) => {
    setBusy(true); setError(""); setReason("");
    setProgress({ phase: "parsing", index: selected, percent: 0, records: 0 });
    try { if (!workerRef.current) throw new Error(); workerRef.current.postMessage(command); }
    catch { fail("transfer_failed"); }
  };
  useEffect(() => {
    createWorker(defaultImportOptions);
    return () => { workerRef.current?.terminate(); workerRef.current = null; };
  }, [files]);

  const result = results[selected];
  const ready = !busy && !error && results.length === files.length && results.every(r => r.issueCount === 0);
  const issueCount = results.reduce((count, r) => count + r.issueCount, 0);
  const update = (key: keyof ImportOptions, value: string | boolean) => {
    const next = { ...options, [key]: value };
    setOptions(next); setResults([]);
    if (key === "encoding" || !workerRef.current || reason === "decode" || reason === "file_read") {
      setBusy(true); setError(""); setReason(""); setChanged([]); createWorker(next);
    } else request({ type: "parse", options: next });
  };
  return (
    <Dialog open onOpenChange={open => { if (!open) cancel(); }}>
      <DialogContent onPointerDownOutside={e => e.preventDefault()} className="max-h-[90vh] max-w-4xl overflow-y-auto" onDragOver={e => e.stopPropagation()} onDrop={e => { e.preventDefault(); e.stopPropagation(); }}>
        <DialogHeader>
          <DialogTitle>{files.length > 1 || baseTable ? "Preview and merge CSV files" : "Preview CSV import"}</DialogTitle>
          <DialogDescription>Files stay on this device. Check the columns and fix structural errors before importing. Changing encoding reloads the original files and resets preview corrections.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">Delimiter<select disabled={busy} className={fieldClass} value={options.delimiter} onChange={e => update("delimiter", e.target.value)}>
            <option value="">Auto-detect</option><option value=",">Comma</option><option value=";">Semicolon</option><option value={"\t"}>Tab</option><option value="|">Pipe</option>
          </select></label>
          <label className="space-y-1 text-sm">Encoding<select disabled={busy} className={fieldClass} value={options.encoding} onChange={e => update("encoding", e.target.value)}>
            <option value="auto">Auto (UTF-8 / UTF-16 BOM)</option><option value="utf-8">UTF-8</option><option value="windows-1252">Windows-1252</option><option value="windows-1250">Windows-1250</option><option value="utf-16le">UTF-16 LE</option><option value="utf-16be">UTF-16 BE</option>
          </select></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={options.header} onChange={e => update("header", e.target.checked)} />First record contains headers</label>
        </div>
        {baseTable && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeCurrent} onChange={e => setIncludeCurrent(e.target.checked)} />Include current editor data ({baseTable.data.length} rows)</label>}
        {files.length > 1 && <p className="text-sm text-muted-foreground">Columns are matched by exact header name. All columns are kept; missing values become empty cells. Files are appended in the order below. The selected import settings apply to all files.</p>}
        <div className="flex flex-wrap gap-2">{files.map((file, i) => <Button key={i} size="sm" variant={selected === i ? "default" : "outline"} onClick={() => setSelected(i)} className="max-w-full truncate">{i + 1}. {file.name}</Button>)}</div>
        {busy && <div role="status" className="space-y-2 text-sm">
          <p>{progress.phase === "reading" ? "Reading" : progress.phase === "decoding" ? "Decoding" : progress.phase === "transferring" ? "Opening in editor" : "Checking records"} · file {progress.index + 1} of {files.length}{progress.phase === "parsing" ? " · " + progress.percent + "% · " + progress.records.toLocaleString() + " records checked" : ""}</p>
          {progress.phase === "parsing" && <progress aria-label="CSV records checked" value={progress.percent} max={100} className="h-2 w-full" />}
          <p className="text-muted-foreground">Large files can take longer and need more memory than their file size. You can cancel at any time; your current editor data stays intact.</p>
        </div>}
        {error && <div role="alert" className="space-y-2 text-sm"><p className="text-destructive">{error}</p>{reason === "decode" && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => update("encoding", "windows-1252")}>Try Windows-1252</Button><Button variant="outline" onClick={() => update("encoding", "windows-1250")}>Try Windows-1250</Button></div>}<Button variant="outline" onClick={() => { if (!workerRef.current || reason === "decode" || reason === "file_read") { setBusy(true); setError(""); setReason(""); createWorker(options); } else request({ type: "parse", options }); }}>Retry with current settings</Button><p className="text-muted-foreground">{workerRef.current ? "Preview corrections are kept when retrying. Changing encoding reloads the original file." : "The worker stopped. Retrying reloads the original files with your current settings; preview corrections must be applied again."}</p></div>}
        {result && !busy && !error && <>
          <p className="text-sm">{result.recordCount} data records · {result.headers.length} columns · Separator: {result.delimiter === "\t" ? "tab" : result.delimiter} · {result.issueCount} record issues</p>
          <div className="max-h-60 overflow-auto rounded-md border">
            <table className="w-full text-sm"><thead><tr>{result.headers.map((h, i) => <th key={i} className="border-b bg-muted px-3 py-2 text-left">{h || "(empty header)"}</th>)}</tr></thead>
              <tbody>{result.data.slice(0, 8).map((row, i) => <tr key={i}>{result.headers.map((h, j) => <td key={j} className="max-w-64 whitespace-pre-wrap break-words border-b px-3 py-2">{row[h]}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {result.issueCount > 0 && <p className="text-sm text-destructive">Import is paused. The table shows valid records only; no invalid record will be silently dropped. Showing {result.issues.length} of {result.issueCount} issues. Fix these to reveal any remaining issues.</p>}
          {result.headers.length === 1 && <p className="text-sm text-muted-foreground">Expected more columns? Change the delimiter above and check the preview.</p>}
          {result.issues.some(issue => issue.kind === "short") && <div className="space-y-2 rounded-md border p-3 text-sm">
            <p>Missing values at the end of records? Add empty trailing cells to {result.issues.filter(issue => issue.kind === "short").length} short records in this preview. Review the columns first: this cannot determine where a missing value belongs. No records are deleted.</p>
            <Button variant="outline" onClick={() => {
              track("record_corrected");
              request({ type: "pad", index: selected });
            }}>Fill trailing empty cells in preview</Button>
          </div>}
          {result.issues.map(issue => <RecordRepair key={`${selected}-${revision}-${issue.start}`} issue={issue} onApply={value => {
            track("record_corrected");
            request({ type: "correct", index: selected, issue, value });
          }} />)}
          {changed[selected] && <Button variant="outline" onClick={() => request({ type: "reset", index: selected })}>Reset corrections for this file</Button>}
        </>}
        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t bg-background py-3">
          {ready && <p role="status" className="mr-auto text-sm">Ready to import. All records passed the structure check.</p>}
          <Button variant="outline" onClick={cancel}>Cancel</Button>
          <Button disabled={!ready} onClick={() => {
            request({ type: "commit", base: includeCurrent ? baseTable : undefined });
            setProgress({ phase: "transferring", index: 0, percent: 100, records: 0 });
          }}>{issueCount ? `Resolve ${issueCount} issues to import` : files.length > 1 || includeCurrent ? "Merge into editor" : "Import into editor"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
