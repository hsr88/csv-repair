import { decodeCsv, parseImport, replaceRecord, padShortRecords, mergeTables, type CsvTable, type ImportOptions, type ImportResult, type RecordIssue } from "./csv-workflows";

type Command =
  | { type: "load"; files: File[]; options: ImportOptions }
  | { type: "parse"; options: ImportOptions }
  | { type: "correct"; index: number; issue: RecordIssue; value: string }
  | { type: "pad" | "reset"; index: number }
  | { type: "commit"; base?: CsvTable };
let originals: string[] = [];
let sources: string[] = [];
let results: ImportResult[] = [];
let options: ImportOptions;
let activeFile = 0;
let phase = "reading";

function parseAll() {
  results = [];
  for (let i = 0; i < sources.length; i++) {
    activeFile = i;
    phase = "parsing";
    self.postMessage({ type: "progress", phase, index: i, percent: 0, records: 0 });
    results.push(parseImport(sources[i], options, (percent, records) => self.postMessage({ type: "progress", phase, index: i, percent, records })));
  }
  // Keep full tables in the worker until the user accepts the import.
  self.postMessage({ type: "preview", results: results.map(r => ({ ...r, data: r.data.slice(0, 8) })), changed: sources.map((s, i) => s !== originals[i]) });
}

self.onmessage = async (event: MessageEvent<Command>) => {
  const command = event.data;
  try {
    if (command.type === "load") {
      options = command.options;
      originals = []; sources = []; results = [];
      for (let i = 0; i < command.files.length; i++) {
        activeFile = i;
        phase = "reading";
        self.postMessage({ type: "progress", phase, index: i, records: 0 });
        const buffer = await command.files[i].arrayBuffer();
        phase = "decoding";
        self.postMessage({ type: "progress", phase, index: i, records: 0 });
        sources.push(decodeCsv(new Uint8Array(buffer), options.encoding));
      }
      originals = [...sources];
    } else if (command.type === "parse") options = command.options;
    else if (command.type === "correct") sources[command.index] = replaceRecord(sources[command.index], command.issue, command.value);
    else if (command.type === "pad") sources[command.index] = padShortRecords(sources[command.index], results[command.index].issues);
    else if (command.type === "reset") sources[command.index] = originals[command.index];
    else if (command.type === "commit") {
      phase = "transferring";
      if (!results.length || results.some(r => r.issueCount > 0)) throw new Error("Resolve record issues before importing.");
      const tables = command.base ? [command.base, ...results] : results;
      const table = tables.length > 1 ? mergeTables(tables) : { headers: results[0].headers, data: results[0].data };
      self.postMessage({ type: "complete", table, delimiter: results[0].delimiter, merged: tables.length > 1 });
      originals = []; sources = []; results = [];
      return;
    }
    parseAll();
  } catch (error) {
    const reason = phase === "reading" ? "file_read" : phase === "decoding" ? "decode" : error instanceof RangeError ? "resource_limit" : error instanceof Error && error.message === "This file has no CSV records." ? "empty_file" : "parse_exception";
    self.postMessage({ type: "error", reason, index: activeFile });
  }
};
