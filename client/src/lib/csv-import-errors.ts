export type ImportErrorReason = "file_read" | "decode" | "empty_file" | "record_structure" | "resource_limit" | "parse_exception" | "worker_failed" | "transfer_failed";
export function importErrorMessage(reason: ImportErrorReason): string {
  const messages: Record<ImportErrorReason, string> = {
    file_read: "The browser could not read this file. Check that it is still available on your device, then retry.",
    decode: "This file is not valid in the selected encoding. Try Windows-1252 for Western European exports or Windows-1250 for Central European exports, then check accented characters in the preview.",
    empty_file: "No CSV records were found. Check that the file contains data, or choose another file. Your editor has not been replaced.",
    record_structure: "Some records need correction. Review the issues below; no records will be silently dropped.",
    resource_limit: "The browser reached a processing limit. Close other memory-heavy tabs and retry, or export smaller parts from the source application.",
    parse_exception: "The CSV parser could not finish checking this file. Check the delimiter and source format, then retry. Your editor has not been replaced.",
    worker_failed: "The background import stopped. This can be caused by a loading failure or browser resource limits. Retry, or try a smaller export from the source application.",
    transfer_failed: "The checked data could not be transferred to the editor. Retry, or try a smaller export from the source application.",
  };
  return messages[reason] ?? messages.parse_exception;
}
