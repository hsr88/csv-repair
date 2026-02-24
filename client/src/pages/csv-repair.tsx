import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  ChevronRight,
  Search,
  Replace,
  Undo2,
  Redo2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Wrench,
  Trash2,
  Plus,
  X,
  GitCompare,
  Keyboard,
  Columns,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Link } from "wouter";

type TabType = "editor" | "sql" | "health";
type SortDir = "asc" | "desc" | null;

interface ParsedCSV {
  data: Record<string, string>[];
  headers: string[];
  delimiter: string;
  errors: Papa.ParseError[];
  fileName: string;
}

interface HistoryEntry {
  data: Record<string, string>[];
  headers: string[];
  label: string;
}

interface SearchState {
  open: boolean;
  query: string;
  replacement: string;
  matchCount: number;
  currentMatch: number;
}

interface ColumnStats {
  header: string;
  totalCount: number;
  uniqueCount: number;
  emptyCount: number;
  isNumeric: boolean;
  min?: number;
  max?: number;
  avg?: number;
  topValues: { value: string; count: number }[];
}

const ROW_HEIGHT = 36;
const COL_WIDTH = 180;
const OVERSCAN = 5;
const MAX_HISTORY = 50;

function computeColumnStats(data: Record<string, string>[], header: string): ColumnStats {
  const values = data.map((r) => r[header] ?? "");
  const nonEmpty = values.filter((v) => v.trim() !== "");
  const uniqueSet = new Set(nonEmpty);
  const nums = nonEmpty.map(Number).filter((n) => !isNaN(n));
  const isNumeric = nums.length > nonEmpty.length * 0.5 && nums.length > 0;

  const freq: Record<string, number> = {};
  for (const v of nonEmpty) {
    freq[v] = (freq[v] || 0) + 1;
  }
  const topValues = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([value, count]) => ({ value, count }));

  return {
    header,
    totalCount: values.length,
    uniqueCount: uniqueSet.size,
    emptyCount: values.length - nonEmpty.length,
    isNumeric,
    min: isNumeric ? Math.min(...nums) : undefined,
    max: isNumeric ? Math.max(...nums) : undefined,
    avg: isNumeric ? nums.reduce((s, n) => s + n, 0) / nums.length : undefined,
    topValues,
  };
}

function VirtualTable({
  data,
  headers,
  editable = false,
  onCellEdit,
  errorRows,
  sortCol,
  sortDir,
  onSort,
  onColumnStats,
  onContextMenu,
  highlightCells,
}: {
  data: Record<string, string>[];
  headers: string[];
  editable?: boolean;
  onCellEdit?: (rowIndex: number, header: string, value: string) => void;
  errorRows?: Set<number>;
  sortCol?: string | null;
  sortDir?: SortDir;
  onSort?: (header: string) => void;
  onColumnStats?: (header: string) => void;
  onContextMenu?: (e: React.MouseEvent, rowIndex: number, header: string) => void;
  highlightCells?: Map<string, boolean>;
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

  const handleKeyDownInEdit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commitEdit();
        if (editingCell) {
          const nextRow = editingCell.row + 1;
          if (nextRow < data.length) {
            setTimeout(() => {
              setEditingCell({ row: nextRow, col: editingCell.col });
              setEditValue(data[nextRow][editingCell.col] || "");
            }, 0);
          }
        }
      } else if (e.key === "Escape") {
        cancelEdit();
      } else if (e.key === "Tab") {
        e.preventDefault();
        commitEdit();
        if (editingCell) {
          const colIdx = headers.indexOf(editingCell.col);
          const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
          if (nextCol >= 0 && nextCol < headers.length) {
            setTimeout(() => {
              setEditingCell({ row: editingCell.row, col: headers[nextCol] });
              setEditValue(data[editingCell.row][headers[nextCol]] || "");
            }, 0);
          }
        }
      }
    },
    [commitEdit, cancelEdit, editingCell, data, headers]
  );

  return (
    <div className="flex flex-col h-full rounded-md border border-border overflow-hidden">
      <div
        ref={headerRef}
        className="flex-shrink-0 overflow-hidden bg-card border-b border-border"
      >
        <div className="flex" style={{ width: `${totalWidth + 60}px` }}>
          <div
            className="flex-shrink-0 flex items-center justify-center text-xs font-medium text-muted-foreground bg-card border-r border-border"
            style={{ width: 60, height: ROW_HEIGHT }}
            data-testid="header-row-num"
          >
            #
          </div>
          {headers.map((h) => (
            <div
              key={h}
              className="flex-shrink-0 flex items-center justify-between px-2 text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border group"
              style={{ width: COL_WIDTH, height: ROW_HEIGHT }}
              title={h}
              data-testid={`header-col-${h}`}
            >
              <span className="truncate flex-1">{h}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {onSort && (
                  <button
                    onClick={() => onSort(h)}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    data-testid={`sort-${h}`}
                  >
                    {sortCol === h && sortDir === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : sortCol === h && sortDir === "desc" ? (
                      <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3" />
                    )}
                  </button>
                )}
                {onColumnStats && (
                  <button
                    onClick={() => onColumnStats(h)}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    data-testid={`stats-${h}`}
                  >
                    <BarChart3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-background"
        onScroll={handleScroll}
        data-testid="virtual-table-body"
      >
        <div style={{ height: `${totalHeight}px`, width: `${totalWidth + 60}px`, position: "relative" }}>
          {visibleRows.map((row, i) => {
            const actualIndex = startRow + i;
            const isErrorRow = errorRows?.has(actualIndex);
            return (
              <div
                key={actualIndex}
                className={`flex absolute left-0 right-0 border-b transition-colors ${
                  isErrorRow
                    ? "border-red-900/50 bg-red-950/20 hover:bg-red-950/30"
                    : "border-border hover:bg-muted/50"
                }`}
                style={{ top: `${actualIndex * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                data-testid={`row-${actualIndex}`}
              >
                <div
                  className={`flex-shrink-0 flex items-center justify-center text-xs font-mono border-r ${
                    isErrorRow
                      ? "text-red-400 bg-red-950/30 border-red-900/50"
                      : "text-muted-foreground bg-card/50 border-border"
                  }`}
                  style={{ width: 60 }}
                >
                  {actualIndex + 1}
                </div>
                {headers.map((h) => {
                  const isEditing = editingCell?.row === actualIndex && editingCell?.col === h;
                  const cellKey = `${actualIndex}:${h}`;
                  const isHighlighted = highlightCells?.has(cellKey);
                  return (
                    <div
                      key={h}
                      className={`flex-shrink-0 flex items-center px-3 border-r text-sm truncate cursor-default ${
                        isHighlighted
                          ? "bg-yellow-900/30 text-yellow-200 border-yellow-800/30"
                          : isErrorRow
                          ? "border-red-900/30 text-muted-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                      style={{ width: COL_WIDTH }}
                      onDoubleClick={() => handleDoubleClick(actualIndex, h)}
                      onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(e, actualIndex, h); } : undefined}
                      data-testid={`cell-${actualIndex}-${h}`}
                    >
                      {isEditing ? (
                        <input
                          className="w-full h-full bg-blue-900/30 text-blue-200 outline-none border border-blue-500 rounded px-1 text-sm font-mono"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={handleKeyDownInEdit}
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

function EmptyState({ onLoadFile, isDragging }: { onLoadFile: () => void; isDragging: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full gap-6 p-8 text-center transition-colors ${
        isDragging ? "bg-blue-950/20" : ""
      }`}
      data-testid="empty-state"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl" />
        <div className={`relative border rounded-2xl p-8 transition-colors ${
          isDragging
            ? "bg-blue-900/30 border-blue-500 border-dashed"
            : "bg-muted/80 border-border"
        }`}>
          <FileSpreadsheet className={`w-16 h-16 mx-auto ${isDragging ? "text-blue-300" : "text-blue-400"}`} />
        </div>
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-foreground">
          {isDragging ? "Drop your CSV here" : "No CSV Loaded"}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {isDragging
            ? "Release to start analyzing your file"
            : "Load or drag & drop a CSV file to start analyzing, querying, and repairing your data."}
        </p>
      </div>
      {!isDragging && (
        <>
          <Button onClick={onLoadFile} className="gap-2" data-testid="button-load-empty">
            <Upload className="w-4 h-4" />
            Load CSV File
          </Button>
          <div className="grid grid-cols-3 gap-4 mt-4 max-w-lg">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/40 border border-border/50">
              <Table2 className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-muted-foreground text-center">Edit cells inline</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/40 border border-border/50">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-muted-foreground text-center">Run SQL queries</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/40 border border-border/50">
              <HeartPulse className="w-5 h-5 text-rose-400" />
              <span className="text-xs text-muted-foreground text-center">Health diagnostics</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LoadingOverlay({ fileName }: { fileName: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6" data-testid="loading-overlay">
      <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">Parsing CSV</p>
        <p className="text-sm text-muted-foreground truncate max-w-xs">{fileName}</p>
      </div>
      <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "70%" }} />
      </div>
    </div>
  );
}

function SearchReplaceBar({
  searchState,
  onSearchChange,
  onReplacementChange,
  onFindNext,
  onFindPrev,
  onReplaceOne,
  onReplaceAll,
  onClose,
}: {
  searchState: SearchState;
  onSearchChange: (q: string) => void;
  onReplacementChange: (r: string) => void;
  onFindNext: () => void;
  onFindPrev: () => void;
  onReplaceOne: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-card border-b border-border" data-testid="search-replace-bar">
      <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <input
        className="bg-muted border border-border rounded px-2 py-1 text-sm text-foreground w-44 focus:outline-none focus:border-blue-500"
        placeholder="Search..."
        value={searchState.query}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
        data-testid="input-search"
      />
      <Replace className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <input
        className="bg-muted border border-border rounded px-2 py-1 text-sm text-foreground w-44 focus:outline-none focus:border-blue-500"
        placeholder="Replace..."
        value={searchState.replacement}
        onChange={(e) => onReplacementChange(e.target.value)}
        data-testid="input-replace"
      />
      <span className="text-xs text-muted-foreground min-w-[60px] text-center">
        {searchState.matchCount > 0
          ? `${searchState.currentMatch + 1}/${searchState.matchCount}`
          : searchState.query
          ? "0 results"
          : ""}
      </span>
      <Button variant="secondary" size="sm" onClick={onFindPrev} disabled={searchState.matchCount === 0} data-testid="button-find-prev">
        <ArrowUp className="w-3 h-3" />
      </Button>
      <Button variant="secondary" size="sm" onClick={onFindNext} disabled={searchState.matchCount === 0} data-testid="button-find-next">
        <ArrowDown className="w-3 h-3" />
      </Button>
      <Button variant="secondary" size="sm" onClick={onReplaceOne} disabled={searchState.matchCount === 0} data-testid="button-replace-one">
        Replace
      </Button>
      <Button variant="secondary" size="sm" onClick={onReplaceAll} disabled={searchState.matchCount === 0} data-testid="button-replace-all">
        All
      </Button>
      <button onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground" data-testid="button-close-search">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ColumnStatsPanel({ stats, onClose }: { stats: ColumnStats; onClose: () => void }) {
  return (
    <div className="absolute right-4 top-14 z-30 w-72 bg-card border border-border rounded-lg shadow-xl p-4 space-y-3" data-testid="column-stats-panel">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground truncate flex-1">{stats.header}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-muted/60 border border-border/50">
          <p className="text-muted-foreground">Total</p>
          <p className="font-mono text-foreground">{stats.totalCount.toLocaleString()}</p>
        </div>
        <div className="p-2 rounded bg-muted/60 border border-border/50">
          <p className="text-muted-foreground">Unique</p>
          <p className="font-mono text-foreground">{stats.uniqueCount.toLocaleString()}</p>
        </div>
        <div className="p-2 rounded bg-muted/60 border border-border/50">
          <p className="text-muted-foreground">Empty</p>
          <p className={`font-mono ${stats.emptyCount > 0 ? "text-amber-400" : "text-foreground"}`}>{stats.emptyCount.toLocaleString()}</p>
        </div>
        <div className="p-2 rounded bg-muted/60 border border-border/50">
          <p className="text-muted-foreground">Type</p>
          <p className="font-mono text-foreground">{stats.isNumeric ? "Numeric" : "Text"}</p>
        </div>
      </div>
      {stats.isNumeric && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded bg-muted/60 border border-border/50">
            <p className="text-muted-foreground">Min</p>
            <p className="font-mono text-foreground">{stats.min?.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded bg-muted/60 border border-border/50">
            <p className="text-muted-foreground">Max</p>
            <p className="font-mono text-foreground">{stats.max?.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded bg-muted/60 border border-border/50">
            <p className="text-muted-foreground">Avg</p>
            <p className="font-mono text-foreground">{stats.avg?.toFixed(2)}</p>
          </div>
        </div>
      )}
      {stats.topValues.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Top values</p>
          {stats.topValues.map((tv, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate flex-1 mr-2">{tv.value || "(empty)"}</span>
              <span className="text-muted-foreground font-mono">{tv.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContextMenu({
  x,
  y,
  onClose,
  onDeleteRow,
  onInsertRowAbove,
  onInsertRowBelow,
  onDeleteColumn,
  onInsertColumnLeft,
  onInsertColumnRight,
}: {
  x: number;
  y: number;
  onClose: () => void;
  onDeleteRow: () => void;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onDeleteColumn: () => void;
  onInsertColumnLeft: () => void;
  onInsertColumnRight: () => void;
}) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [onClose]);

  const menuItems = [
    { label: "Insert Row Above", icon: Plus, action: onInsertRowAbove, testId: "ctx-insert-row-above" },
    { label: "Insert Row Below", icon: Plus, action: onInsertRowBelow, testId: "ctx-insert-row-below" },
    { label: "Delete Row", icon: Trash2, action: onDeleteRow, danger: true, testId: "ctx-delete-row" },
    { type: "sep" as const },
    { label: "Insert Column Left", icon: Columns, action: onInsertColumnLeft, testId: "ctx-insert-col-left" },
    { label: "Insert Column Right", icon: Columns, action: onInsertColumnRight, testId: "ctx-insert-col-right" },
    { label: "Delete Column", icon: Trash2, action: onDeleteColumn, danger: true, testId: "ctx-delete-col" },
  ];

  return (
    <div
      className="fixed z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{ left: x, top: y }}
      data-testid="context-menu"
    >
      {menuItems.map((item, i) =>
        "type" in item ? (
          <div key={i} className="h-px bg-border my-1" />
        ) : (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); item.action(); onClose(); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
              item.danger ? "text-red-400" : "text-muted-foreground"
            }`}
            data-testid={item.testId}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

function DiffPreview({
  originalData,
  currentData,
  headers,
  onClose,
}: {
  originalData: Record<string, string>[];
  currentData: Record<string, string>[];
  headers: string[];
  onClose: () => void;
}) {
  const changes: { row: number; col: string; oldVal: string; newVal: string }[] = [];
  const maxRows = Math.max(originalData.length, currentData.length);
  for (let r = 0; r < maxRows; r++) {
    for (const h of headers) {
      const oldV = r < originalData.length ? (originalData[r][h] ?? "") : "";
      const newV = r < currentData.length ? (currentData[r][h] ?? "") : "";
      if (oldV !== newV) {
        changes.push({ row: r, col: h, oldVal: oldV, newVal: newV });
      }
    }
  }

  const addedRows = currentData.length - originalData.length;
  const removedCols = new Set<string>();
  const addedCols = new Set<string>();

  return (
    <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="diff-preview">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-foreground">Changes Preview</h3>
            <Badge variant="secondary" className="no-default-active-elevate text-xs">
              {changes.length} change{changes.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {changes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-sm text-muted-foreground">No changes detected</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {changes.slice(0, 200).map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2 bg-muted/50 rounded-md">
                  <span className="text-muted-foreground font-mono flex-shrink-0 w-20 text-right">
                    R{c.row + 1}:{c.col}
                  </span>
                  <span className="text-red-400 line-through truncate flex-1">{c.oldVal || "(empty)"}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-emerald-400 truncate flex-1">{c.newVal || "(empty)"}</span>
                </div>
              ))}
              {changes.length > 200 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  ...and {changes.length - 200} more changes
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KeyboardShortcutsHelp({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { keys: "Ctrl+Z", desc: "Undo" },
    { keys: "Ctrl+Y", desc: "Redo" },
    { keys: "Ctrl+F", desc: "Search & Replace" },
    { keys: "Ctrl+S", desc: "Export CSV" },
    { keys: "Ctrl+Shift+R", desc: "Auto-Repair" },
    { keys: "Double-click", desc: "Edit cell" },
    { keys: "Enter", desc: "Save edit & move down" },
    { keys: "Tab / Shift+Tab", desc: "Move to next/prev cell" },
    { keys: "Escape", desc: "Cancel edit" },
    { keys: "Right-click", desc: "Context menu (add/remove rows & cols)" },
    { keys: "?", desc: "Show this help" },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="shortcuts-help" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.desc}</span>
              <kbd className="bg-muted border border-border rounded px-2 py-0.5 text-xs font-mono text-muted-foreground">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataEditorTab({
  csvData,
  onCellEdit,
  errorRows,
  sortCol,
  sortDir,
  onSort,
  onColumnStats,
  columnStats,
  onCloseStats,
  onContextMenu,
  contextMenu,
  searchState,
  highlightCells,
}: {
  csvData: ParsedCSV;
  onCellEdit: (rowIndex: number, header: string, value: string) => void;
  errorRows: Set<number>;
  sortCol: string | null;
  sortDir: SortDir;
  onSort: (header: string) => void;
  onColumnStats: (header: string) => void;
  columnStats: ColumnStats | null;
  onCloseStats: () => void;
  onContextMenu: (e: React.MouseEvent, rowIndex: number, header: string) => void;
  contextMenu: { x: number; y: number; row: number; col: string } | null;
  searchState: SearchState;
  highlightCells: Map<string, boolean>;
}) {
  return (
    <div className="flex flex-col h-full gap-3 p-4 relative" data-testid="tab-editor">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">Data Editor</h2>
          <Badge variant="secondary" className="no-default-active-elevate text-xs">
            {csvData.data.length.toLocaleString()} rows
          </Badge>
          <Badge variant="secondary" className="no-default-active-elevate text-xs">
            {csvData.headers.length} cols
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Double-click to edit | Right-click for options</p>
      </div>
      <div className="flex-1 min-h-0 relative">
        <VirtualTable
          data={csvData.data}
          headers={csvData.headers}
          editable
          onCellEdit={onCellEdit}
          errorRows={errorRows}
          sortCol={sortCol}
          sortDir={sortDir}
          onSort={onSort}
          onColumnStats={onColumnStats}
          onContextMenu={onContextMenu}
          highlightCells={highlightCells}
        />
        {columnStats && <ColumnStatsPanel stats={columnStats} onClose={onCloseStats} />}
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
        <h2 className="text-sm font-semibold text-foreground">SQL Query</h2>
      </div>
      <div className="flex flex-col gap-2">
        <textarea
          className="w-full h-28 bg-card border border-border rounded-md p-3 text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 placeholder:text-muted-foreground"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SELECT * FROM ? LIMIT 10"
          spellCheck={false}
          data-testid="input-sql-query"
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={runQuery} disabled={isRunning || !query.trim()} className="gap-1.5" data-testid="button-run-sql">
            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            RUN
          </Button>
          <span className="text-xs text-muted-foreground">
            Use <code className="bg-muted px-1 py-0.5 rounded text-blue-400">?</code> to reference your CSV data
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
            <span className="text-xs text-muted-foreground">{results.length.toLocaleString()} row{results.length !== 1 ? "s" : ""} returned</span>
          </div>
          {results.length > 0 ? (
            <div className="flex-1 min-h-0"><VirtualTable data={results} headers={resultHeaders} /></div>
          ) : (
            <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">Query returned no results.</div>
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
        <h2 className="text-sm font-semibold text-foreground">Health Check</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-md bg-muted/60 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Rows</p>
          <p className="text-lg font-bold text-foreground font-mono" data-testid="text-row-count">{csvData.data.length.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-md bg-muted/60 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Columns</p>
          <p className="text-lg font-bold text-foreground font-mono" data-testid="text-col-count">{csvData.headers.length}</p>
        </div>
        <div className="p-3 rounded-md bg-muted/60 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Delimiter</p>
          <p className="text-lg font-bold text-foreground font-mono" data-testid="text-delimiter">
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
            <p className="text-sm text-muted-foreground">No structural errors detected in this CSV file.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1 overflow-auto" data-testid="health-errors">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">{errors.length} error{errors.length !== 1 ? "s" : ""} found</span>
          </div>
          <div className="space-y-1.5 overflow-auto">
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-900/30 rounded-md" data-testid={`error-item-${i}`}>
                <FileWarning className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <Badge variant="destructive" className="no-default-active-elevate text-xs">{err.type}</Badge>
                    {err.row !== undefined && <span className="text-xs text-muted-foreground font-mono">Row {err.row}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{err.message}</p>
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
  const [originalData, setOriginalData] = useState<Record<string, string>[] | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFileName, setLoadingFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const [columnStats, setColumnStats] = useState<ColumnStats | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: number; col: string } | null>(null);

  const [searchState, setSearchState] = useState<SearchState>({
    open: false, query: "", replacement: "", matchCount: 0, currentMatch: 0,
  });

  const [showDiff, setShowDiff] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const pushHistory = useCallback(
    (data: Record<string, string>[], headers: string[], label: string) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        const next = [...trimmed, { data, headers, label }];
        if (next.length > MAX_HISTORY) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [historyIndex]
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo || !csvData) return;
    const prev = history[historyIndex - 1];
    setHistoryIndex((i) => i - 1);
    setCsvData((d) => d ? { ...d, data: prev.data, headers: prev.headers } : d);
    toast({ title: "Undo", description: `Reverted: ${history[historyIndex].label}` });
  }, [canUndo, csvData, history, historyIndex, toast]);

  const handleRedo = useCallback(() => {
    if (!canRedo || !csvData) return;
    const next = history[historyIndex + 1];
    setHistoryIndex((i) => i + 1);
    setCsvData((d) => d ? { ...d, data: next.data, headers: next.headers } : d);
    toast({ title: "Redo", description: `Re-applied: ${next.label}` });
  }, [canRedo, csvData, history, historyIndex, toast]);

  const errorRows = useMemo(() => {
    if (!csvData) return new Set<number>();
    const rows = new Set<number>();
    for (const err of csvData.errors) {
      if (err.row !== undefined) rows.add(err.row);
    }
    return rows;
  }, [csvData]);

  const searchMatches = useMemo(() => {
    if (!csvData || !searchState.query) return [];
    const q = searchState.query.toLowerCase();
    const matches: { row: number; col: string }[] = [];
    for (let r = 0; r < csvData.data.length; r++) {
      for (const h of csvData.headers) {
        if ((csvData.data[r][h] ?? "").toLowerCase().includes(q)) {
          matches.push({ row: r, col: h });
        }
      }
    }
    return matches;
  }, [csvData, searchState.query]);

  useEffect(() => {
    setSearchState((s) => ({
      ...s,
      matchCount: searchMatches.length,
      currentMatch: searchMatches.length > 0 ? Math.min(s.currentMatch, searchMatches.length - 1) : 0,
    }));
  }, [searchMatches.length]);

  const highlightCells = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!searchState.query) return map;
    for (const m of searchMatches) {
      map.set(`${m.row}:${m.col}`, true);
    }
    return map;
  }, [searchMatches, searchState.query]);

  const handleLoadFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const processFile = useCallback(
    (file: File) => {
      setIsLoading(true);
      setLoadingFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        worker: true,
        complete: (results) => {
          if (!results.meta.fields || results.meta.fields.length === 0) {
            setIsLoading(false);
            toast({ title: "Parse Error", description: "Could not detect any columns.", variant: "destructive" });
            return;
          }
          const data = results.data as Record<string, string>[];
          const headers = results.meta.fields || [];
          setCsvData({
            data,
            headers,
            delimiter: results.meta.delimiter,
            errors: results.errors,
            fileName: file.name,
          });
          setOriginalData(data.map((r) => ({ ...r })));
          setHistory([{ data, headers, label: "Initial load" }]);
          setHistoryIndex(0);
          setSortCol(null);
          setSortDir(null);
          setColumnStats(null);
          setSearchState({ open: false, query: "", replacement: "", matchCount: 0, currentMatch: 0 });
          setIsLoading(false);
          setActiveTab("editor");
          if (results.errors.length > 0) {
            toast({
              title: "File Loaded with Warnings",
              description: `${results.errors.length} structural error${results.errors.length !== 1 ? "s" : ""} detected. Check the Health Check tab.`,
            });
          }
        },
        error: (err) => {
          setIsLoading(false);
          toast({ title: "Failed to Parse CSV", description: err.message || "Unexpected error.", variant: "destructive" });
        },
      });
    },
    [toast]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleCellEdit = useCallback(
    (rowIndex: number, header: string, value: string) => {
      if (!csvData) return;
      setCsvData((prev) => {
        if (!prev) return prev;
        const newData = [...prev.data];
        newData[rowIndex] = { ...newData[rowIndex], [header]: value };
        pushHistory(newData, prev.headers, `Edit R${rowIndex + 1}:${header}`);
        return { ...prev, data: newData };
      });
    },
    [csvData, pushHistory]
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

  const handleSort = useCallback(
    (header: string) => {
      if (!csvData) return;
      let newDir: SortDir;
      if (sortCol !== header) newDir = "asc";
      else if (sortDir === "asc") newDir = "desc";
      else newDir = null;

      setSortCol(newDir ? header : null);
      setSortDir(newDir);

      if (!newDir) {
        const entry = history[0];
        if (entry) {
          setCsvData((d) => d ? { ...d, data: [...entry.data] } : d);
        }
        return;
      }

      setCsvData((prev) => {
        if (!prev) return prev;
        const sorted = [...prev.data].sort((a, b) => {
          const va = a[header] ?? "";
          const vb = b[header] ?? "";
          const na = Number(va);
          const nb = Number(vb);
          if (!isNaN(na) && !isNaN(nb)) {
            return newDir === "asc" ? na - nb : nb - na;
          }
          return newDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
        });
        return { ...prev, data: sorted };
      });
    },
    [csvData, sortCol, sortDir, history]
  );

  const handleColumnStats = useCallback(
    (header: string) => {
      if (!csvData) return;
      setColumnStats(computeColumnStats(csvData.data, header));
    },
    [csvData]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, row: number, col: string) => {
      setContextMenu({ x: e.clientX, y: e.clientY, row, col });
    },
    []
  );

  const handleInsertRow = useCallback(
    (position: "above" | "below") => {
      if (!csvData || !contextMenu) return;
      const idx = position === "above" ? contextMenu.row : contextMenu.row + 1;
      const newRow: Record<string, string> = {};
      csvData.headers.forEach((h) => (newRow[h] = ""));
      const newData = [...csvData.data];
      newData.splice(idx, 0, newRow);
      pushHistory(newData, csvData.headers, `Insert row ${position} R${contextMenu.row + 1}`);
      setCsvData((d) => d ? { ...d, data: newData } : d);
    },
    [csvData, contextMenu, pushHistory]
  );

  const handleDeleteRow = useCallback(() => {
    if (!csvData || !contextMenu) return;
    const newData = csvData.data.filter((_, i) => i !== contextMenu.row);
    pushHistory(newData, csvData.headers, `Delete row ${contextMenu.row + 1}`);
    setCsvData((d) => d ? { ...d, data: newData } : d);
  }, [csvData, contextMenu, pushHistory]);

  const handleInsertColumn = useCallback(
    (position: "left" | "right") => {
      if (!csvData || !contextMenu) return;
      const colIdx = csvData.headers.indexOf(contextMenu.col);
      const insertIdx = position === "left" ? colIdx : colIdx + 1;
      let newName = "new_column";
      let counter = 1;
      while (csvData.headers.includes(newName)) {
        newName = `new_column_${counter++}`;
      }
      const newHeaders = [...csvData.headers];
      newHeaders.splice(insertIdx, 0, newName);
      const newData = csvData.data.map((row) => ({ ...row, [newName]: "" }));
      pushHistory(newData, newHeaders, `Insert column "${newName}"`);
      setCsvData((d) => d ? { ...d, data: newData, headers: newHeaders } : d);
    },
    [csvData, contextMenu, pushHistory]
  );

  const handleDeleteColumn = useCallback(() => {
    if (!csvData || !contextMenu) return;
    if (csvData.headers.length <= 1) {
      toast({ title: "Cannot delete", description: "Must keep at least one column.", variant: "destructive" });
      return;
    }
    const colToDelete = contextMenu.col;
    const newHeaders = csvData.headers.filter((h) => h !== colToDelete);
    const newData = csvData.data.map((row) => {
      const newRow = { ...row };
      delete newRow[colToDelete];
      return newRow;
    });
    pushHistory(newData, newHeaders, `Delete column "${colToDelete}"`);
    setCsvData((d) => d ? { ...d, data: newData, headers: newHeaders } : d);
  }, [csvData, contextMenu, pushHistory, toast]);

  const handleSearchChange = useCallback((q: string) => {
    setSearchState((s) => ({ ...s, query: q, currentMatch: 0 }));
  }, []);

  const handleReplacementChange = useCallback((r: string) => {
    setSearchState((s) => ({ ...s, replacement: r }));
  }, []);

  const handleFindNext = useCallback(() => {
    setSearchState((s) => ({
      ...s,
      currentMatch: s.matchCount > 0 ? (s.currentMatch + 1) % s.matchCount : 0,
    }));
  }, []);

  const handleFindPrev = useCallback(() => {
    setSearchState((s) => ({
      ...s,
      currentMatch: s.matchCount > 0 ? (s.currentMatch - 1 + s.matchCount) % s.matchCount : 0,
    }));
  }, []);

  const handleReplaceOne = useCallback(() => {
    if (!csvData || searchMatches.length === 0) return;
    const match = searchMatches[searchState.currentMatch];
    if (!match) return;
    const newData = [...csvData.data];
    const oldVal = newData[match.row][match.col] ?? "";
    newData[match.row] = {
      ...newData[match.row],
      [match.col]: oldVal.replace(new RegExp(searchState.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), searchState.replacement),
    };
    pushHistory(newData, csvData.headers, `Replace in R${match.row + 1}:${match.col}`);
    setCsvData((d) => d ? { ...d, data: newData } : d);
  }, [csvData, searchMatches, searchState, pushHistory]);

  const handleReplaceAll = useCallback(() => {
    if (!csvData || searchMatches.length === 0) return;
    const regex = new RegExp(searchState.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const newData = csvData.data.map((row) => {
      const newRow = { ...row };
      for (const h of csvData.headers) {
        if (newRow[h]) newRow[h] = newRow[h].replace(regex, searchState.replacement);
      }
      return newRow;
    });
    pushHistory(newData, csvData.headers, `Replace all "${searchState.query}" -> "${searchState.replacement}"`);
    setCsvData((d) => d ? { ...d, data: newData } : d);
    toast({ title: "Replace All", description: `Replaced ${searchMatches.length} occurrence${searchMatches.length !== 1 ? "s" : ""}.` });
  }, [csvData, searchMatches, searchState, pushHistory, toast]);

  const handleAutoRepair = useCallback(() => {
    if (!csvData) return;
    let repairCount = 0;
    const newData = csvData.data
      .filter((row) => {
        const allEmpty = csvData.headers.every((h) => (row[h] ?? "").trim() === "");
        if (allEmpty) repairCount++;
        return !allEmpty;
      })
      .map((row) => {
        const newRow = { ...row };
        for (const h of csvData.headers) {
          if (newRow[h] && newRow[h] !== newRow[h].trim()) {
            newRow[h] = newRow[h].trim();
            repairCount++;
          }
        }
        return newRow;
      });
    pushHistory(newData, csvData.headers, "Auto-repair");
    setCsvData((d) => d ? { ...d, data: newData } : d);
    toast({
      title: "Auto-Repair Complete",
      description: repairCount > 0
        ? `Fixed ${repairCount} issue${repairCount !== 1 ? "s" : ""} (empty rows removed, whitespace trimmed).`
        : "No issues found to repair.",
    });
  }, [csvData, pushHistory, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (ctrl && e.key === "f") {
        e.preventDefault();
        if (csvData) setSearchState((s) => ({ ...s, open: !s.open }));
      } else if (ctrl && e.key === "s") {
        e.preventDefault();
        handleExport();
      } else if (ctrl && e.shiftKey && e.key === "R") {
        e.preventDefault();
        handleAutoRepair();
      } else if (e.key === "?" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo, handleExport, handleAutoRepair, csvData]);

  const tabs = [
    { id: "editor" as TabType, label: "Data Editor", icon: Table2, color: "text-blue-400" },
    { id: "sql" as TabType, label: "SQL Query", icon: Terminal, color: "text-emerald-400" },
    { id: "health" as TabType, label: "Health Check", icon: HeartPulse, color: "text-rose-400" },
  ];

  const errorCount = csvData?.errors.length ?? 0;
  const changeCount = originalData && csvData
    ? (() => {
        let count = 0;
        const maxR = Math.max(originalData.length, csvData.data.length);
        for (let r = 0; r < maxR; r++) {
          for (const h of csvData.headers) {
            const o = r < originalData.length ? (originalData[r]?.[h] ?? "") : "";
            const n = r < csvData.data.length ? (csvData.data[r]?.[h] ?? "") : "";
            if (o !== n) count++;
          }
        }
        return count;
      })()
    : 0;

  return (
    <div
      className="flex flex-col h-screen bg-background text-foreground"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isLoading && <LoadingOverlay fileName={loadingFileName} />}
      {showDiff && csvData && originalData && (
        <DiffPreview
          originalData={originalData}
          currentData={csvData.data}
          headers={csvData.headers}
          onClose={() => setShowDiff(false)}
        />
      )}
      {showShortcuts && <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt"
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-file"
      />

      <header className="flex items-center justify-between gap-3 px-4 h-14 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              <span className="text-base font-bold tracking-tight text-foreground">
                csv<span className="text-blue-400">.</span>repair
              </span>
              <Badge variant="secondary" className="no-default-active-elevate text-[10px] uppercase tracking-widest px-1.5 py-0">
                Beta
              </Badge>
            </div>
          </Link>
          {csvData && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <ChevronRight className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{csvData.fileName}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {csvData && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo}
                data-testid="button-undo"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo}
                data-testid="button-redo"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearchState((s) => ({ ...s, open: !s.open }))}
                data-testid="button-search"
                title="Search & Replace (Ctrl+F)"
              >
                <Search className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAutoRepair}
                data-testid="button-auto-repair"
                title="Auto-Repair (Ctrl+Shift+R)"
              >
                <Wrench className="w-3.5 h-3.5" />
              </Button>
              {changeCount > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDiff(true)}
                  className="gap-1.5"
                  data-testid="button-diff"
                  title="View Changes"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span className="text-xs">{changeCount}</span>
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowShortcuts(true)}
                data-testid="button-shortcuts"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button variant="secondary" size="sm" onClick={handleExport} className="gap-1.5" data-testid="button-export">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleLoadFile} className="gap-1.5" data-testid="button-load-csv">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Load CSV</span>
            <span className="sm:hidden">Load</span>
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Navigation />
        </div>
      </header>

      {csvData && searchState.open && (
        <SearchReplaceBar
          searchState={searchState}
          onSearchChange={handleSearchChange}
          onReplacementChange={handleReplacementChange}
          onFindNext={handleFindNext}
          onFindPrev={handleFindPrev}
          onReplaceOne={handleReplaceOne}
          onReplaceAll={handleReplaceAll}
          onClose={() => setSearchState((s) => ({ ...s, open: false }))}
        />
      )}

      {isDragging && csvData && (
        <div className="absolute inset-0 z-30 bg-blue-950/30 border-2 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
          <div className="bg-card border border-blue-500 rounded-lg px-6 py-4 text-center">
            <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-foreground">Drop to replace current file</p>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <nav className="flex-shrink-0 w-48 border-r border-border bg-card/50 flex flex-col py-3 gap-1 px-2" data-testid="sidebar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
            <div className="mt-auto pt-4 px-2 border-t border-border space-y-2">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Rows</span>
                  <span className="text-muted-foreground font-mono">{csvData.data.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Columns</span>
                  <span className="text-muted-foreground font-mono">{csvData.headers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Errors</span>
                  <span className={`font-mono ${errorCount > 0 ? "text-red-400" : "text-emerald-400"}`}>{errorCount}</span>
                </div>
                {changeCount > 0 && (
                  <div className="flex justify-between">
                    <span>Changes</span>
                    <span className="text-blue-400 font-mono">{changeCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        <main className="flex-1 min-w-0 min-h-0 overflow-hidden relative">
          {!csvData ? (
            <EmptyState onLoadFile={handleLoadFile} isDragging={isDragging} />
          ) : activeTab === "editor" ? (
            <DataEditorTab
              csvData={csvData}
              onCellEdit={handleCellEdit}
              errorRows={errorRows}
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
              onColumnStats={handleColumnStats}
              columnStats={columnStats}
              onCloseStats={() => setColumnStats(null)}
              onContextMenu={handleContextMenu}
              contextMenu={contextMenu}
              searchState={searchState}
              highlightCells={highlightCells}
            />
          ) : activeTab === "sql" ? (
            <SQLQueryTab csvData={csvData} />
          ) : (
            <HealthCheckTab csvData={csvData} />
          )}

          {contextMenu && csvData && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
              onDeleteRow={handleDeleteRow}
              onInsertRowAbove={() => handleInsertRow("above")}
              onInsertRowBelow={() => handleInsertRow("below")}
              onDeleteColumn={handleDeleteColumn}
              onInsertColumnLeft={() => handleInsertColumn("left")}
              onInsertColumnRight={() => handleInsertColumn("right")}
            />
          )}
        </main>
      </div>
    </div>
  );
}
