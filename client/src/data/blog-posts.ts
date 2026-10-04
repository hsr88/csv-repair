import { csvGuides } from "./csv-guides";
import { refreshedPosts } from "./refreshed-posts";
import { workflowRelease } from "./workflow-release";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedDate?: string;
  readingTime: string;
  keywords: string[];
  content: string;
}

export const blogPosts: BlogPost[] = [
  workflowRelease,
  ...csvGuides,
  ...refreshedPosts,
  {
    slug: "csv-vs-tsv-difference",
    title: "CSV vs TSV — What's the Difference and When to Use Each",
    description: "Understand the key differences between CSV and TSV file formats, their pros and cons, and when to choose one over the other for your data workflows.",
    date: "2026-02-24",
    readingTime: "5 min read",
    keywords: ["CSV vs TSV", "TSV file", "tab separated values", "CSV format", "data format comparison"],
    content: `## CSV and TSV: Two Flavors of Plain Text Data

If you work with data, you've almost certainly encountered both CSV and TSV files. They look similar, serve the same purpose, and can often be used interchangeably — but there are important differences that can save you hours of debugging.

## What Is CSV?

CSV stands for **Comma-Separated Values**. Each line represents a row of data, and fields within a row are separated by commas.

\`\`\`
name,age,city
Alice,30,New York
Bob,25,"San Francisco"
\`\`\`

CSV is the most widely supported tabular data format. Nearly every database, spreadsheet app, programming language, and data tool can read and write CSV files.

## What Is TSV?

TSV stands for **Tab-Separated Values**. It's identical to CSV except it uses tab characters (\`\\t\`) instead of commas to separate fields.

\`\`\`
name	age	city
Alice	30	New York
Bob	25	San Francisco
\`\`\`

TSV is common in bioinformatics, linguistics, and Unix/Linux tooling where tab-delimited formats are traditional.

## Key Differences

| Feature | CSV | TSV |
|---------|-----|-----|
| Delimiter | Comma (\`,\`) | Tab (\`\\t\`) |
| Quoting | Required for fields with commas | Rarely needed |
| Human readability | Moderate | Better (columns align visually) |
| Excel default | Yes | Yes (with .tsv extension) |
| Commas in data | Must be quoted | No issue |
| Tabs in data | No issue | Must be escaped or avoided |
| File size | Slightly smaller | Slightly larger |

## When to Use CSV

- **General data exchange** — CSV is the universal format. When in doubt, use CSV.
- **Web APIs and exports** — Most services export data as CSV.
- **When your data contains tabs** — If your values might include tab characters, CSV avoids confusion.

## When to Use TSV

- **Scientific and research data** — Many bioinformatics tools expect TSV.
- **Data with lots of commas** — If your text fields frequently contain commas (addresses, descriptions), TSV avoids the quoting complexity.
- **Unix command-line processing** — Tools like \`cut\`, \`awk\`, and \`sort\` handle TSV more naturally.

## Can csv.repair Handle TSV Files?

Yes. csv.repair automatically detects the delimiter when you load a file. Whether your file uses commas, tabs, semicolons, or pipes — the parser identifies the correct separator and displays your data correctly. You can load .csv, .tsv, or .txt files.

## Conclusion

Both CSV and TSV are excellent formats for tabular data. CSV is more universal; TSV is cleaner when your data contains commas. The best choice depends on your specific use case and the tools in your workflow.

Regardless of which format you use, [csv.repair](https://csv.repair) can help you fix, analyze, and clean your data files.`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
