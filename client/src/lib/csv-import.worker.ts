import { parseImport, type ImportOptions } from "./csv-workflows";

self.onmessage = (event: MessageEvent<{ text: string; options: ImportOptions }>) => {
  try {
    self.postMessage({ result: parseImport(event.data.text, event.data.options) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Could not parse this CSV." });
  }
};
