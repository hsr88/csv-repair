import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/navigation";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What file formats does csv.repair support?",
    answer: "csv.repair supports CSV, TSV, and plain text files with delimited data. The parser automatically detects the delimiter (comma, tab, semicolon, pipe, etc.), so you don't need to specify it manually.",
  },
  {
    question: "Is there a file size limit?",
    answer: "There is no hard file size limit. csv.repair uses Web Workers for parsing and virtual scrolling for rendering, so it can handle files with millions of rows. Performance depends on your device's available memory and processing power. Files up to several hundred megabytes typically work smoothly on modern computers.",
  },
  {
    question: "Is my data uploaded to a server?",
    answer: "No. csv.repair processes everything entirely in your browser. Your files are never uploaded, stored, or transmitted to any server. This makes it completely safe to use with sensitive, proprietary, or personally identifiable data.",
  },
  {
    question: "Can I run SQL queries on my CSV data?",
    answer: "Yes! csv.repair includes a built-in SQL query engine powered by AlaSQL. You can write SQL queries like SELECT, WHERE, GROUP BY, ORDER BY, JOIN, and aggregate functions directly on your data. Use the '?' symbol to reference your loaded CSV in queries.",
  },
  {
    question: "What does Auto-Repair do exactly?",
    answer: "Auto-Repair performs two operations: it removes completely empty rows (where every cell is blank or whitespace-only) and trims leading/trailing whitespace from all cell values. These are the most common issues in CSV files exported from various systems.",
  },
  {
    question: "Can I undo changes if I make a mistake?",
    answer: "Yes. csv.repair maintains a full edit history of up to 50 steps. Use Ctrl+Z to undo and Ctrl+Y to redo. This includes all operations: cell edits, auto-repair, search & replace, row/column insertions, and deletions.",
  },
  {
    question: "How do I edit a cell?",
    answer: "Double-click on any cell to start editing. Press Enter to save your change and move to the cell below, Tab to save and move to the next cell, Shift+Tab to move to the previous cell, or Escape to cancel the edit.",
  },
  {
    question: "What are the keyboard shortcuts?",
    answer: "Ctrl+Z: Undo | Ctrl+Y: Redo | Ctrl+F: Search & Replace | Ctrl+S: Export CSV | Ctrl+Shift+R: Auto-Repair | Double-click: Edit cell | Right-click: Context menu | ?: Show shortcuts help.",
  },
  {
    question: "How do I add or remove rows and columns?",
    answer: "Right-click on any cell to open the context menu. From there you can insert a row above or below, delete the current row, insert a column to the left or right, or delete the current column.",
  },
  {
    question: "What does the Health Check show?",
    answer: "The Health Check tab displays a summary of your file (row count, column count, detected delimiter) and lists any structural errors found during parsing — such as rows with too many or too few fields, unclosed quotes, or encoding issues. Error rows are also highlighted in red in the Data Editor.",
  },
  {
    question: "Can I preview my changes before exporting?",
    answer: "Yes. When you've made changes, a 'Changes' button appears in the toolbar showing the number of modifications. Click it to see a detailed diff view showing every changed cell with its old and new values.",
  },
  {
    question: "What format is the exported file?",
    answer: "The exported file is a standard CSV file with comma delimiters and UTF-8 encoding. The filename is automatically prefixed with 'repaired_' followed by the original filename.",
  },
  {
    question: "Does csv.repair work offline?",
    answer: "Once the page is loaded, csv.repair works fully offline. No internet connection is needed for parsing, editing, querying, or exporting your CSV files.",
  },
  {
    question: "Why can't I open my CSV file in Excel?",
    answer: "Excel has a row limit of approximately 1,048,576 rows. If your CSV exceeds this limit, Excel will either refuse to open it or silently truncate the data. csv.repair has no such limitation and can handle files with millions of rows.",
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        data-testid={`faq-toggle-${item.question.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className="text-sm font-medium text-foreground">{item.question}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-8">
          <HelpCircle className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQAccordion key={i} item={faq} />
          ))}
        </div>
      </div>
    </div>
  );
}
