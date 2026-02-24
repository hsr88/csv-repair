import { useEffect } from "react";
import { FileSpreadsheet, Heart } from "lucide-react";
import { PageHeader, PageFooter } from "@/components/navigation";

export default function AboutPage() {
  useEffect(() => {
    document.title = "About csv.repair - Free Online CSV File Repair Tool";
    document.querySelector('meta[name="description"]')?.setAttribute("content", "Learn about csv.repair, a free browser-based tool for analyzing, querying, and repairing broken or oversized CSV files. No upload needed — your data stays private.");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-8">
          <FileSpreadsheet className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">
            About csv<span className="text-blue-500">.</span>repair
          </h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-lg text-foreground">
            csv.repair is a powerful, browser-based tool designed for analyzing, querying, and repairing broken or oversized CSV files — the kind that crash Excel, freeze Google Sheets, or simply refuse to open in traditional spreadsheet software.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">Why csv.repair?</h2>
          <p>
            Every day, data analysts, developers, and business professionals encounter CSV files that are too large, malformed, or structurally broken to work with using conventional tools. Microsoft Excel has a hard limit of approximately 1,048,576 rows, and many CSV files exported from databases, APIs, or legacy systems far exceed that. Even when the file fits within those limits, encoding issues, inconsistent delimiters, extra columns, missing values, and trailing whitespace can turn a simple import into hours of frustration.
          </p>
          <p>
            csv.repair was built to solve exactly this problem. It runs entirely in your browser using advanced web technologies like Web Workers for non-blocking parsing and a custom virtualized table renderer capable of handling millions of rows without breaking a sweat. There is no upload to any server — your data never leaves your machine.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">Key Capabilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Massive file support</strong> — Load and browse CSV files with millions of rows thanks to virtual scrolling and efficient memory usage.</li>
            <li><strong>Inline cell editing</strong> — Double-click any cell to edit it directly. Navigate between cells with Tab, Enter, and Escape keys.</li>
            <li><strong>SQL queries</strong> — Run SQL queries directly on your CSV data using AlaSQL. Filter, aggregate, join, and transform without leaving the tool.</li>
            <li><strong>Health diagnostics</strong> — Instantly identify structural issues: missing fields, extra columns, encoding problems, and malformed rows. Error rows are highlighted in red for quick navigation.</li>
            <li><strong>Auto-repair</strong> — One-click repair that trims leading/trailing whitespace and removes completely empty rows.</li>
            <li><strong>Repair Templates</strong> — A library of predefined repair actions: trim whitespace, remove empty or duplicate rows, standardize dates to ISO format, lowercase emails, normalize phone numbers, fix common encoding issues (mojibake), and clean URLs. Select a template and apply it with a single click.</li>
            <li><strong>Column Distribution Charts</strong> — Visualize the distribution of values in any column. Numeric columns display a histogram, while categorical columns show a pie chart. Charts are rendered interactively with Recharts and update instantly when you select a different column.</li>
            <li><strong>Automatic Data Type Detection</strong> — csv.repair automatically detects the data type of each column: date, email, URL, phone number, currency, number, or plain text. Detected types are shown in column statistics and used by repair templates to target the right columns (e.g., only lowercasing cells detected as emails).</li>
            <li><strong>Search & Replace</strong> — Find and replace text across all cells with match highlighting and one-by-one or bulk replacement.</li>
            <li><strong>Undo/Redo</strong> — Full 50-step edit history so you can experiment without fear of losing your work.</li>
            <li><strong>Column statistics</strong> — View total count, unique values, empty cells, data type detection, and min/max/avg for numeric columns.</li>
            <li><strong>Column sorting</strong> — Sort any column ascending, descending, or reset to original order.</li>
            <li><strong>Context menu</strong> — Right-click to insert or delete rows and columns at any position.</li>
            <li><strong>Change diff preview</strong> — Before exporting, review every modification you made in a clear old-vs-new comparison view.</li>
            <li><strong>Drag & drop</strong> — Simply drag a CSV file onto the page to load it instantly.</li>
            <li><strong>Keyboard shortcuts</strong> — Ctrl+Z/Y for undo/redo, Ctrl+F for search, Ctrl+S for export, and more.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8">Privacy & Security</h2>
          <p>
            csv.repair processes everything locally in your browser. Your CSV files are never uploaded to any server, stored in any cloud, or shared with any third party. This makes it safe to use with sensitive, proprietary, or personally identifiable data. The tool works offline once loaded — no internet connection is required for processing.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">Who Is It For?</h2>
          <p>
            csv.repair is designed for anyone who regularly works with CSV data: data engineers cleaning up ETL outputs, analysts preparing datasets for import, developers debugging API exports, marketing teams managing campaign data, e-commerce managers handling product catalogs, and researchers working with large survey or experimental datasets. If you have ever stared at a broken CSV file wondering where to even start, csv.repair is the tool you need.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">Technology</h2>
          <p>
            Built with React, TypeScript, and Tailwind CSS. CSV parsing is powered by PapaParse with Web Worker support for non-blocking processing. SQL query execution uses AlaSQL. The virtual table renderer is custom-built for maximum performance with minimal memory overhead.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">Support the Project</h2>
          <p>
            If you find csv.repair useful and want to support its development, consider buying me a coffee. Every contribution helps keep the project alive and growing.
          </p>
          <a
            href="https://ko-fi.com/hsr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium no-underline"
            data-testid="about-kofi"
          >
            <Heart className="w-4 h-4" />
            Support on Ko-fi
          </a>
        </div>
      </div>
      <PageFooter />
    </div>
  );
}
