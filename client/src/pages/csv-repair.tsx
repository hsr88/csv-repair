import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Papa from "papaparse";
import {
  Upload,
  Download,
  Table2,
  Terminal,
  HeartPulse,
  Play,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileWarning,
  Loader2,
  Search,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type TabType = "editor" | "sql" | "health";

interface ParsedCSV {
  data: Record<string, string>[];
  headers: string[];
  delimiter: string;
  errors: Papa.ParseError[];
  fileName: string;
}

const ROW_HEIGHT = 36;
const COL_WIDTH = 180;
const OVERSCAN = 5;

function VirtualTable({
  data,
  headers,
  editable = false,
  onCellEdit,
}: {
  data: Record<string, string>[];
  headers: string[];
  editable?: boolean;
  onCellEdit?: (rowIndex: number, header: string, value: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const totalHeight = data.length * ROW_HEIGHT;
  const totalWidth = headers.length * COL_WIDTH;
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endRow = Math.min(data.length, startRow + visibleCount);
  const visibleRows = data.slice(startRow, endRow);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    if (headerRef.current) {
      headerRef.current.scrollLeft = target.scrollLeft;
    }
  }, []);

  const handleDoubleClick = useCallback(
    (rowIndex: number, header: string) => {
      if (!editable) return;
      setEditingCell({ row: rowIndex, col: header });
      setEditValue(data[rowIndex][header] || "");
    },
    [editable, data]
  );

  const commitEdit = useCallback(() => {
    if (editingCell && onCellEdit) {
      onCellEdit(editingCell.row, editingCell.col, editValue);
    }
    setEditingCell(null);
  }, [editingCell, editValue, onCellEdit]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  return (
    <div className="flex flex-col h-full rounded-md border border-border overflow-hidden">
      <div
        ref={headerRef}
        className="flex-shrink-0 overflow-hidden bg-slate-900 dark:bg-slate-900 border-b border-slate-700"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="flex" style={{ width: `${totalWidth + 60}px` }}>
          <div
            className="flex-shrink-0 flex items-center justify-center text-xs font-medium text-slate-400 bg-slate-900 border-r border-slate-700"
            style={{ width: 60, height: ROW_HEIGHT }}
            data-testid="header-row-num"
          >
            #
          </div>
          {headers.map((h) => (
            <div
              key={h}
              className="flex-shrink-0 flex items-center px-3 text-xs font-semibold text-slate-200 uppercase tracking-wider border-r border-slate-700 truncate"
              style={{ width: COL_WIDTH, height: ROW_HEIGHT }}
              title={h}
              data-testid={`header-col-${h}`}
            >
              {h}
            </div>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-950"
        onScroll={handleScroll}
        data-testid="virtual-table-body"
      >
        <div style={{ height: `${totalHeight}px`, width: `${totalWidth + 60}px`, position: "relative" }}>
          {visibleRows.map((row, i) => {
            const actualIndex = startRow + i;
            return (
              <div
                key={actualIndex}
                className="flex absolute left-0 right-0 border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                style={{ top: `${actualIndex * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                data-testid={`row-${actualIndex}`}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center text-xs text-slate-500 bg-slate-900/50 border-r border-slate-800 font-mono"
                  style={{ width: 60 }}
                >
                  {actualIndex + 1}
                </div>
                {headers.map((h) => {
                  const isEditing = editingCell?.row === actualIndex && editingCell?.col === h;
                  return (
                    <div
                      key={h}
                      className="flex-shrink-0 flex items-center px-3 border-r border-slate-800 text-sm text-slate-300 truncate cursor-default"
                      style={{ width: COL_WIDTH }}
                      onDoubleClick={() => handleDoubleClick(actualIndex, h)}
                      data-testid={`cell-${actualIndex}-${h}`}
                    >
                      {isEditing ? (
                        <input
                          className="w-full h-full bg-blue-900/30 text-blue-200 outline-none border border-blue-500 rounded px-1 text-sm font-mono"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                          data-testid={`edit-input-${actualIndex}-${h}`}
                        />
                      ) : (
                        <span className="truncate">{row[h] ?? ""}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onLoadFile }: { onLoadFile: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center" data-testid="empty-state">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="relative bg-slate-800/80 border border-slate-700 rounded-2xl p-8">
          <FileSpreadsheet className="w-16 h-16 text-blue-400 mx-auto" />
        </div>
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-slate-100">No CSV Loaded</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Load a CSV file to start analyzing, querying, and repairing your data.
          Handles massive files that would crash spreadsheet applications.
        </p>
      </div>
      <Button onClick={onLoadFile} className="gap-2" data-testid="button-load-empty">
        <Upload className="w-4 h-4" />
        Load CSV File
      </Button>
      <div className="grid grid-cols-3 gap-4 mt-4 max-w-lg">
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <Table2 className="w-5 h-5 text-blue-400" />
          <span className="text-xs text-slate-400 text-center">Edit cells inline</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span className="text-xs text-slate-400 text-center">Run SQL queries</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <HeartPulse className="w-5 h-5 text-rose-400" />
          <span className="text-xs text-slate-400 text-center">Health diagnostics</span>
        </div>
      </div>
    </div>
  );
}

function LoadingOverlay({ fileName }: { fileName: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6" data-testid="loading-overlay">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-slate-100">Parsing CSV</p>
        <p className="text-sm text-slate-400 truncate max-w-xs">{fileName}</p>
      </div>
      <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "70%" }} />
      </div>
    </div>
  );
}

function DataEditorTab({
  csvData,
  onCellEdit,
}: {
  csvData: ParsedCSV;
  onCellEdit: (rowIndex: number, header: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col h-full gap-3 p-4" data-testid="tab-editor">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-200">Data Editor</h2>
          <Badge variant="secondary" className="no-default-active-elevate text-xs">
            {csvData.data.length.toLocaleString()} rows
          </Badge>
          <Badge variant="secondary" className="no-default-active-elevate text-xs">
            {csvData.headers.length} cols
          </Badge>
        </div>
        <p className="text-xs text-slate-500">Double-click a cell to edit</p>
      </div>
      <div className="flex-1 min-h-0">
        <VirtualTable
          data={csvData.data}
          headers={csvData.headers}
          editable
          onCellEdit={onCellEdit}
        />
      </div>
    </div>
  );
}

function SQLQueryTab({ csvData }: { csvData: ParsedCSV }) {
  const [query, setQuery] = useState("SELECT * FROM ? LIMIT 10");
  const [results, setResults] = useState<Record<string, string>[] | null>(null);
  const [resultHeaders, setResultHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runQuery = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);
    try {
      const alasql = (await import("alasql")).default;
      const res = alasql(query, [csvData.data]);
      if (Array.isArray(res) && res.length > 0) {
        setResultHeaders(Object.keys(res[0]));
        setResults(res);
      } else if (Array.isArray(res)) {
        setResults([]);
        setResultHeaders([]);
      } else {
        setResults([{ result: String(res) }]);
        setResultHeaders(["result"]);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred executing the query.");
    } finally {
      setIsRunning(false);
    }
  }, [query, csvData.data]);

  return (
    <div className="flex flex-col h-full gap-4 p-4" data-testid="tab-sql">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-slate-200">SQL Query</h2>
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          className="w-full h-28 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 placeholder:text-slate-600"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SELECT * FROM ? LIMIT 10"
          spellCheck={false}
          data-testid="input-sql-query"
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={runQuery}
            disabled={isRunning || !query.trim()}
            className="gap-1.5"
            data-testid="button-run-sql"
          >
            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            RUN
          </Button>
          <span className="text-xs text-slate-500">
            Use <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-400">?</code> to reference your CSV data
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-md" data-testid="sql-error">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 font-mono break-all">{error}</p>
        </div>
      )}

      {results !== null && !error && (
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-400">
              {results.length.toLocaleString()} row{results.length !== 1 ? "s" : ""} returned
            </span>
          </div>
          {results.length > 0 ? (
            <div className="flex-1 min-h-0">
              <VirtualTable data={results} headers={resultHeaders} />
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-slate-500 text-sm">
              Query returned no results.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HealthCheckTab({ csvData }: { csvData: ParsedCSV }) {
  const errors = csvData.errors;

  return (
    <div className="flex flex-col h-full gap-4 p-4" data-testid="tab-health">
      <div className="flex items-center gap-2">
        <HeartPulse className="w-4 h-4 text-rose-400" />
        <h2 className="text-sm font-semibold text-slate-200">Health Check</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-md bg-slate-800/60 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Rows</p>
          <p className="text-lg font-bold text-slate-100 font-mono" data-testid="text-row-count">
            {csvData.data.length.toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-md bg-slate-800/60 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Columns</p>
          <p className="text-lg font-bold text-slate-100 font-mono" data-testid="text-col-count">
            {csvData.headers.length}
          </p>
        </div>
        <div className="p-3 rounded-md bg-slate-800/60 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Delimiter</p>
          <p className="text-lg font-bold text-slate-100 font-mono" data-testid="text-delimiter">
            {csvData.delimiter === "," ? "comma" : csvData.delimiter === "\t" ? "tab" : csvData.delimiter === ";" ? "semicolon" : `"${csvData.delimiter}"`}
          </p>
        </div>
      </div>

      {errors.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8" data-testid="health-success">
          <div className="p-4 rounded-full bg-emerald-950/40 border border-emerald-800/50">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold text-emerald-300">File is Healthy</p>
            <p className="text-sm text-slate-400">No structural errors detected in this CSV file.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1 overflow-auto" data-testid="health-errors">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">
              {errors.length} error{errors.length !== 1 ? "s" : ""} found
            </span>
          </div>
          <div className="space-y-1.5 overflow-auto">
            {errors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-900/30 rounded-md"
                data-testid={`error-item-${i}`}
              >
                <FileWarning className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <Badge variant="destructive" className="no-default-active-elevate text-xs">
                      {err.type}
                    </Badge>
                    {err.row !== undefined && (
                      <span className="text-xs text-slate-500 font-mono">Row {err.row}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">{err.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CsvRepairPage() {
  const [csvData, setCsvData] = useState<ParsedCSV | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFileName, setLoadingFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLoadFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setLoadingFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      complete: (results) => {
        if (!results.meta.fields || results.meta.fields.length === 0) {
          setIsLoading(false);
          toast({
            title: "Parse Error",
            description: "Could not detect any columns in this file. Please check the file format.",
            variant: "destructive",
          });
          return;
        }
        setCsvData({
          data: results.data as Record<string, string>[],
          headers: results.meta.fields || [],
          delimiter: results.meta.delimiter,
          errors: results.errors,
          fileName: file.name,
        });
        setIsLoading(false);
        setActiveTab("editor");
        if (results.errors.length > 0) {
          toast({
            title: "File Loaded with Warnings",
            description: `${results.errors.length} structural error${results.errors.length !== 1 ? "s" : ""} detected. Check the Health Check tab for details.`,
          });
        }
      },
      error: (err) => {
        setIsLoading(false);
        toast({
          title: "Failed to Parse CSV",
          description: err.message || "An unexpected error occurred while parsing the file.",
          variant: "destructive",
        });
      },
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [toast]);

  const handleCellEdit = useCallback(
    (rowIndex: number, header: string, value: string) => {
      if (!csvData) return;
      setCsvData((prev) => {
        if (!prev) return prev;
        const newData = [...prev.data];
        newData[rowIndex] = { ...newData[rowIndex], [header]: value };
        return { ...prev, data: newData };
      });
    },
    [csvData]
  );

  const handleExport = useCallback(() => {
    if (!csvData) return;
    const csv = Papa.unparse(csvData.data, { columns: csvData.headers });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const baseName = csvData.fileName.replace(/\.csv$/i, "");
    a.href = url;
    a.download = `repaired_${baseName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [csvData]);

  const tabs = [
    { id: "editor" as TabType, label: "Data Editor", icon: Table2, color: "text-blue-400" },
    { id: "sql" as TabType, label: "SQL Query", icon: Terminal, color: "text-emerald-400" },
    { id: "health" as TabType, label: "Health Check", icon: HeartPulse, color: "text-rose-400" },
  ];

  const errorCount = csvData?.errors.length ?? 0;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {isLoading && <LoadingOverlay fileName={loadingFileName} />}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt"
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-file"
      />

      <header className="flex items-center justify-between gap-3 px-4 h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            <span className="text-base font-bold tracking-tight text-slate-100">
              csv<span className="text-blue-400">.</span>repair
            </span>
            <Badge variant="secondary" className="no-default-active-elevate text-[10px] uppercase tracking-widest px-1.5 py-0">
              Beta
            </Badge>
          </div>
          {csvData && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <ChevronRight className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{csvData.fileName}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {csvData && (
            <Button variant="secondary" size="sm" onClick={handleExport} className="gap-1.5" data-testid="button-export">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Fixed CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
          )}
          <Button size="sm" onClick={handleLoadFile} className="gap-1.5" data-testid="button-load-csv">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Load CSV</span>
            <span className="sm:hidden">Load</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className="flex-shrink-0 w-48 border-r border-slate-800 bg-slate-900/50 flex flex-col py-3 gap-1 px-2" data-testid="sidebar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? tab.color : ""}`} />
                {tab.label}
                {tab.id === "health" && errorCount > 0 && (
                  <Badge variant="destructive" className="no-default-active-elevate ml-auto text-[10px] px-1.5 py-0">
                    {errorCount}
                  </Badge>
                )}
              </button>
            );
          })}

          {csvData && (
            <div className="mt-auto pt-4 px-2 border-t border-slate-800 space-y-2">
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Rows</span>
                  <span className="text-slate-300 font-mono">{csvData.data.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Columns</span>
                  <span className="text-slate-300 font-mono">{csvData.headers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Errors</span>
                  <span className={`font-mono ${errorCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {errorCount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </nav>

        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {!csvData ? (
            <EmptyState onLoadFile={handleLoadFile} />
          ) : activeTab === "editor" ? (
            <DataEditorTab csvData={csvData} onCellEdit={handleCellEdit} />
          ) : activeTab === "sql" ? (
            <SQLQueryTab csvData={csvData} />
          ) : (
            <HealthCheckTab csvData={csvData} />
          )}
        </main>
      </div>
    </div>
  );
}
