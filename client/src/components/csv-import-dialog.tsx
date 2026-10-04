import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { defaultImportOptions, mergeTables, replaceRecord, type CsvTable, type ImportOptions, type ImportResult, type RecordIssue } from "@/lib/csv-workflows";

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
      <p className="text-xs text-muted-foreground">Short records are suggested with empty fields at the end. Check where the missing value belongs. Quote errors may include several records: restore their intended boundaries.</p>
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
  const [sources, setSources] = useState<string[]>([]);
  const [originals, setOriginals] = useState<string[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [reading, setReading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [includeCurrent, setIncludeCurrent] = useState(!!baseTable);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setReading(true); setError(""); setResults([]); setSources([]);
    Promise.all(files.map(async file => new TextDecoder(options.encoding, { fatal: true }).decode(await file.arrayBuffer()).replace(/^\uFEFF/, "")))
      .then(texts => { if (!cancelled) { setSources(texts); setOriginals(texts); setRevision(r => r + 1); } })
      .catch(() => { if (!cancelled) setError("Cannot decode the file with this encoding. Try the encoding used by the source exporter."); })
      .finally(() => { if (!cancelled) setReading(false); });
    return () => { cancelled = true; };
  }, [files, options.encoding]);

  useEffect(() => {
    if (!sources.length) { setParsing(false); return; }
    let cancelled = false;
    let worker: Worker | undefined;
    setParsing(true); setResults([]); setError("");
    const run = async () => {
      const parsed: ImportResult[] = [];
      for (const text of sources) {
        const result = await new Promise<ImportResult>((resolve, reject) => {
          worker = new Worker(new URL("../lib/csv-import.worker.ts", import.meta.url), { type: "module" });
          worker.onmessage = ({ data }) => { worker?.terminate(); data.error ? reject(new Error(data.error)) : resolve(data.result); };
          worker.onerror = () => { worker?.terminate(); reject(new Error("CSV parsing failed. Try a smaller file or check the source format.")); };
          worker.postMessage({ text, options });
        });
        if (cancelled) return;
        parsed.push(result);
      }
      if (!cancelled) setResults(parsed);
    };
    run().catch(e => { if (!cancelled) setError(e.message); }).finally(() => { if (!cancelled) setParsing(false); });
    return () => { cancelled = true; worker?.terminate(); };
  }, [sources, options.delimiter, options.header, options.encoding]);

  const busy = reading || parsing;
  const result = results[selected];
  const ready = !busy && !error && results.length === files.length && results.every(r => r.issueCount === 0);
  const issueCount = results.reduce((count, r) => count + r.issueCount, 0);
  const update = (key: keyof ImportOptions, value: string | boolean) => {
    setResults([]);
    setRevision(r => r + 1);
    setOptions(prev => ({ ...prev, [key]: value }));
  };
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto" onDragOver={e => e.stopPropagation()} onDrop={e => { e.preventDefault(); e.stopPropagation(); }}>
        <DialogHeader>
          <DialogTitle>{files.length > 1 || baseTable ? "Preview and merge CSV files" : "Preview CSV import"}</DialogTitle>
          <DialogDescription>Files stay on this device. Check the columns and fix structural errors before importing. Changing encoding reloads the original files and resets preview corrections.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">Delimiter<select className={fieldClass} value={options.delimiter} onChange={e => update("delimiter", e.target.value)}>
            <option value="">Auto-detect</option><option value=",">Comma</option><option value=";">Semicolon</option><option value={"\t"}>Tab</option><option value="|">Pipe</option>
          </select></label>
          <label className="space-y-1 text-sm">Encoding<select className={fieldClass} value={options.encoding} onChange={e => update("encoding", e.target.value)}>
            <option value="utf-8">UTF-8</option><option value="windows-1252">Windows-1252</option><option value="windows-1250">Windows-1250</option><option value="utf-16le">UTF-16 LE</option><option value="utf-16be">UTF-16 BE</option>
          </select></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={options.header} onChange={e => update("header", e.target.checked)} />First record contains headers</label>
        </div>
        {baseTable && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeCurrent} onChange={e => setIncludeCurrent(e.target.checked)} />Include current editor data ({baseTable.data.length} rows)</label>}
        {files.length > 1 && <p className="text-sm text-muted-foreground">Columns are matched by exact header name. All columns are kept; missing values become empty cells. Files are appended in the order below. The selected import settings apply to all files.</p>}
        <div className="flex flex-wrap gap-2">{files.map((file, i) => <Button key={i} size="sm" variant={selected === i ? "default" : "outline"} onClick={() => setSelected(i)} className="max-w-full truncate">{i + 1}. {file.name}</Button>)}</div>
        {busy && <p role="status" className="text-sm">{reading ? "Reading files…" : "Checking CSV records…"}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {result && !busy && <>
          <p className="text-sm">{result.recordCount} data records · {result.headers.length} columns · Separator: {result.delimiter === "\t" ? "tab" : result.delimiter} · {result.issueCount} record issues</p>
          <div className="max-h-60 overflow-auto rounded-md border">
            <table className="w-full text-sm"><thead><tr>{result.headers.map((h, i) => <th key={i} className="border-b bg-muted px-3 py-2 text-left">{h || "(empty header)"}</th>)}</tr></thead>
              <tbody>{result.data.slice(0, 8).map((row, i) => <tr key={i}>{result.headers.map((h, j) => <td key={j} className="max-w-64 whitespace-pre-wrap break-words border-b px-3 py-2">{row[h]}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {result.issueCount > 0 && <p className="text-sm text-destructive">Import is paused. The table shows valid records only; no invalid record will be silently dropped. Showing {result.issues.length} of {result.issueCount} issues. Fix these to reveal any remaining issues.</p>}
          {result.issues.map(issue => <RecordRepair key={`${selected}-${revision}-${issue.start}`} issue={issue} onApply={value => {
            try {
              const next = replaceRecord(sources[selected], issue, value);
              setResults([]); setSources(prev => prev.map((s, i) => i === selected ? next : s)); setRevision(r => r + 1);
            } catch (e) { setError((e as Error).message); }
          }} />)}
          {sources[selected] !== originals[selected] && <Button variant="outline" onClick={() => { setResults([]); setSources(prev => prev.map((s, i) => i === selected ? originals[i] : s)); setRevision(r => r + 1); }}>Reset corrections for this file</Button>}
        </>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!ready} onClick={() => {
            const tables = includeCurrent && baseTable ? [baseTable, ...results] : results;
            const merged = tables.length > 1;
            onImport(merged ? mergeTables(tables) : results[0], results[0].delimiter, merged ? "merged.csv" : files[0].name);
          }}>{issueCount ? `Resolve ${issueCount} issues to import` : files.length > 1 || includeCurrent ? "Merge into editor" : "Import into editor"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
