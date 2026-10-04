import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadCsv, splitRanges, type CsvTable } from "@/lib/csv-workflows";

export function CsvFileTools({ table, filename, onMerge }: { table?: CsvTable; filename?: string; onMerge: (files: File[]) => void }) {
  const [size, setSize] = useState("100000");
  const [parts, setParts] = useState<{ table: CsvTable; ranges: { start: number; end: number }[] }>();
  const [error, setError] = useState("");
  return <div className="h-full overflow-auto p-4 space-y-8">
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Merge CSV files</h2>
      <p className="max-w-2xl text-sm text-muted-foreground">Append files by exact column name, even when columns are in a different order. Keep every column and fill missing fields with empty values. Review import settings and errors before replacing the editor data.</p>
      <label className="block space-y-2 text-sm">Choose CSV files to merge<input type="file" accept=".csv,.tsv,.txt" multiple className="block max-w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-foreground" data-testid="input-merge-files" onChange={e => {
        const files = Array.from(e.target.files ?? []); e.target.value = ""; if (files.length) onMerge(files);
      }} /></label>
      <p className="text-xs text-muted-foreground">{table ? "You can include the current editor data in the preview." : "Choose two or more files, or import a file first."}</p>
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Split CSV into smaller files</h2>
      <p className="max-w-2xl text-sm text-muted-foreground">Each part includes the current headers. Rows are counted as CSV records, so quoted multiline cells stay together. Downloads use UTF-8 and comma separators.</p>
      {!table ? <p className="text-sm">Import a CSV to split it.</p> : <>
        <label className="block max-w-xs space-y-1 text-sm">Data rows per file<input type="number" min="1" step="1" value={size} onChange={e => { setSize(e.target.value); setParts(undefined); }} className="w-full rounded-md border border-input bg-background px-3 py-2" /></label>
        <Button disabled={!table.data.length} onClick={() => { try { setParts({ table, ranges: splitRanges(table.data.length, Number(size)) }); setError(""); } catch (e) { setError((e as Error).message); setParts(undefined); } }}>Prepare split files</Button>
        {!table.data.length && <p className="text-sm text-muted-foreground">There are no data rows to split.</p>}
      </>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {parts && parts.table === table && <div className="space-y-2">
        <p role="status" className="text-sm">{parts.ranges.length} files ready. Download each part below.</p>
        {parts.ranges.map((range, i) => <div key={i} className="flex flex-wrap items-center gap-3 text-sm">
          <Button variant="outline" size="sm" onClick={() => downloadCsv({ headers: table.headers, data: table.data.slice(range.start, range.end) }, `${(filename || "data").replace(/\.[^.]+$/, "")}_part_${i + 1}.csv`)}>Download part {i + 1}</Button>
          <span className="text-muted-foreground">Rows {range.start + 1}–{range.end} · {range.end - range.start} records</span>
        </div>)}
      </div>}
    </section>
  </div>;
}
