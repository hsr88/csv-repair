import type { BlogPost } from "./blog-posts";

export const refreshedPosts: BlogPost[] = [
  {
    slug: "how-to-fix-broken-csv-file",
    title: "How to Fix a Broken CSV File: Diagnose, Repair, Verify",
    description: "Fix a broken CSV by identifying delimiter, quote, encoding and column errors. Follow practical examples and verify that the repair preserved your records.",
    date: "2026-02-25",
    updatedDate: "2026-10-04",
    readingTime: "6 min read",
    keywords: ["fix broken csv", "repair csv file", "malformed csv", "csv errors"],
    content: `To fix a broken CSV file, identify what failed before changing the data: the delimiter, field boundaries, character encoding, or the receiving application's import settings. Work on a copy, correct that cause, then reopen the result and compare it with the source.

A file that opens without an error is not necessarily repaired. A parser can accept a row whose values are in the wrong columns, and a spreadsheet can quietly change an identifier.

## Choose the fix that matches the symptom

| What you see | What to check first | Detailed walkthrough |
|-------------|---------------------|----------------------|
| Every record appears in one column | Import delimiter | [CSV opens in one Excel column](/blog/csv-opens-in-one-column-excel) |
| Some rows have extra or missing cells | Field counts and raw records | [Fix inconsistent columns](/blog/csv-inconsistent-columns) |
| Addresses split or several rows merge | Quotes around punctuation and newlines | [Fix CSV commas and quotes](/blog/csv-commas-double-quotes) |
| Names contain Ã© or replacement characters | Original file encoding | [Fix encoding issues](/blog/common-csv-encoding-issues) |
| IDs lose zeros when opened in Excel | Automatic numeric conversion | [Keep leading zeros](/blog/csv-leading-zeros-excel) |
| pandas reports Expected X fields, saw Y | Parser settings and malformed records | [Diagnose pandas ParserError](/blog/pandas-parsererror-expected-fields-saw) |
| The application freezes or cannot load everything | Memory and worksheet limits | [Work with large CSV files](/blog/how-to-clean-large-csv-files) |

## Save the original before trying a repair

Keep an untouched copy, especially if a spreadsheet has already changed the preview. Record the source's expected row count, headers and any totals you can reconcile later.

For exported business data, an independent source count is more useful than a count of text lines. A quoted note can span several lines while remaining one CSV record.

If the export is empty, truncated, or missing whole records, try downloading it again from the source system. A repair tool cannot reconstruct information that was never included in the file.

## Inspect the CSV in the browser

[Load a copy in csv.repair](/). The import preview lets you choose the delimiter, encoding and header setting, then review structural issues before loading the editor. CSV processing happens locally on your device.

Compare the headers and a few records with the source. Pay particular attention to the first failing row, the preceding row, and fields containing punctuation.

If a quote error has merged records or a row has values beyond the headers, compare the original raw record with its proposed correction in the import preview. Edit the correction and apply it to rerun the checks. Import stays paused until structural issues are resolved. The [new workflow guide](/blog/csv-import-preview-merge-split-saved-repairs) shows these controls.

## Fix a concrete structural error

This CSV has three headers, but the first record contains an extra field:

\`\`\`csv
id,address,city
101,12 King Street, Apt 4,London
102,8 Oak Road,Bristol
\`\`\`

If the source confirms that the unit number belongs to the address, the repaired version is:

\`\`\`csv
id,address,city
101,"12 King Street, Apt 4",London
102,8 Oak Road,Bristol
\`\`\`

Now each data record has three fields. The address retains its comma. The [column-count guide](/blog/csv-inconsistent-columns) also covers missing values, where inserting a separator in the wrong place can produce the right count but the wrong data.

For fields containing literal double quotes or line breaks, use the [quoting examples](/blog/csv-commas-double-quotes). Do not remove punctuation wholesale to make an importer stop complaining.

## Apply cleanup only after the columns are correct

Once the file parses into the intended table, use inline editing for individual corrections. Double-click a cell, edit it, and press Enter to save. The [CSV editing walkthrough](/blog/edit-csv-without-excel) explains search, replacement and exporting a separate copy.

**Auto-Repair** trims whitespace and removes empty rows. Use it when those changes match your goal. It does not infer missing values or reconstruct broken quote boundaries.

Repair templates handle specific transformations. **Fix Common Encoding Issues** replaces a defined set of mojibake sequences; it does not detect every possible source encoding. Review changes to names and free-text fields. Dates such as \`01/02/2026\` also need a known source convention before standardization.

## Export, reload and compare

Choose the delimiter and decimal convention expected by the next application. If that application needs a UTF-8 BOM, select it in export options. A BOM helps identify encoding; it does not repair already corrupted text.

For the address example, verify two records, three columns, and the full address for ID 101. For your own data:

- Compare the record count with the original export or source system.
- Confirm that headers and column order match the destination schema.
- Inspect every repaired record and a sample of unaffected records.
- Check identifiers, non-English names, dates and amounts.
- Reconcile totals where appropriate, then test the actual destination import.

You can use the SQL tab for a quick count:

\`\`\`sql
SELECT COUNT(*) AS total_rows FROM ?
\`\`\`

Compare that number with an independent expectation. A count of a misparsed table alone cannot prove that no records were lost.

## Prevent the next broken export

Use a CSV writer rather than concatenating values with commas. Document the delimiter, encoding and expected columns. Keep identifiers as text during spreadsheet imports, and include a small validation check in recurring export jobs.

If your starting point is a table on a webpage, our [Table Capture & Extractor extension](https://chromewebstore.google.com/detail/table-capture-extractor/hmehfffhilmehojjlkoogagjmkdoddlk) provides a capture preview and CSV export. Check the preview against the source table before continuing with file cleanup.

[Inspect your broken CSV in csv.repair](/). Start with the warnings, fix the cause, and keep the original until the repaired copy passes your checks.`,
  },
  {
    slug: "common-csv-encoding-issues",
    title: "Common CSV Encoding Issues and How to Fix Them",
    description: "Fix garbled CSV characters by checking the original encoding. Learn when UTF-8, Windows-1252 and a BOM help, and when you need a fresh source export.",
    date: "2026-02-26",
    updatedDate: "2026-10-04",
    readingTime: "5 min read",
    keywords: ["CSV encoding", "UTF-8 CSV", "fix garbled text CSV", "mojibake CSV", "Windows-1252"],
    content: `CSV encoding problems happen when an application decodes a file's bytes using the wrong character encoding. A name such as René may appear as RenÃ© even though the original file still contains the right data. Reopen the untouched file with the correct encoding before saving any changes.

Saving garbled text as UTF-8 does not automatically restore it. That can simply preserve the wrong characters in a new encoding.

## Recognize the symptom

| Symptom | Possible explanation | First step |
|---------|----------------------|------------|
| René appears as RenÃ© | UTF-8 bytes decoded with a Western legacy encoding | Reopen the original as UTF-8 |
| A letter appears as � | A decoder replaced an invalid byte sequence | Go back to the original bytes and identify the source encoding |
| The first header starts with ï»¿ | A UTF-8 BOM was read as ordinary characters | Check encoding and BOM handling |
| Accented names work in one application but not another | Different import defaults | Set the encoding explicitly in the receiving application |

These are clues rather than a universal detection algorithm. A plain ASCII-only sample cannot distinguish many encodings because the basic letters use the same bytes.

## Reopen first, convert second

Ask the producing system which encoding it exports. UTF-8 is a useful default for new exports, but older Windows data may use Windows-1252 or a different regional encoding. Windows-1252 and ISO-8859-1 are not interchangeable for every byte.

In VS Code, click the encoding indicator in the status bar, choose **Reopen with Encoding**, and select the source encoding. Check several known names. Once they display correctly, choose **Save with Encoding** and save a separate UTF-8 copy. The [VS Code encoding documentation](https://code.visualstudio.com/docs/editing/codebasics#_file-encoding-support) describes these controls.

Do not overwrite the only original while experimenting. If a failed conversion has replaced different letters with the same replacement character, the saved text no longer tells you which letters were there.

## Test a known value

Use a UTF-8 sample containing characters you can recognize:

\`\`\`csv
id,name,city
1,René,Montréal
2,Zoë,Zürich
\`\`\`

After conversion or import, expect the same two records and exactly those names. Include examples from the languages present in your actual data; one corrected accent does not validate every character in a multilingual file.

If the text is correct but all fields appear in one column, follow the [delimiter guide](/blog/csv-opens-in-one-column-excel). Encoding and field separation are separate settings.

## What csv.repair can correct

[Open a copy in csv.repair](/) and inspect affected cells. The **Fix Common Encoding Issues** template replaces a defined list of common mojibake sequences, including some incorrectly displayed accented Latin characters.

It is a targeted text repair, not a universal encoding converter. It cannot recover unknown characters that have already been replaced with question marks or replacement symbols. For an original Windows-1252, Windows-1250 or UTF-16 file, choose the matching encoding in the import preview instead of relying on substitutions. Convert other source encodings with an appropriate tool before importing.

Review each changed value, then export a separate copy. csv.repair exports UTF-8 and offers an optional BOM. Check the exported file in the destination application too.

## When to add a UTF-8 BOM

A byte order mark is a marker at the start of a file. Some applications use it to recognize UTF-8. It does not change the delimiter, declare column types, or fix text that was already decoded incorrectly.

Use the BOM option if your receiving workflow needs it. For scripts, choose a reader that handles it explicitly. Python's \`utf-8-sig\` encoding reads UTF-8 and removes an initial UTF-8 BOM if present:

\`\`\`python
import csv

with open("input.csv", encoding="utf-8-sig", newline="") as source:
    rows = list(csv.reader(source))
\`\`\`

For large files, iterate through the reader rather than storing every row in a list. The [large CSV guide](/blog/how-to-clean-large-csv-files) shows that workflow.

## Validate more than the preview

Compare the output against known source values. Check headers, accented names, punctuation and any currency symbols used in the file. Reopen the result after saving, then import it into the intended destination.

If a header or row is also structurally broken, use the [CSV repair checklist](/blog/how-to-fix-broken-csv-file) to diagnose that separately. Changing encoding should not be used to hide field-count errors.

[Inspect your CSV text locally](/). Use the common-character template only when it matches the corruption you can actually see; keep the original bytes for anything that needs a proper conversion.`,
  },
  {
    slug: "how-to-clean-large-csv-files",
    title: "How to Clean and Edit Large CSV Files Without Excel",
    description: "Clean large CSV files with a browser editor or a streaming script. Filter the records you need, preserve quoted fields and verify the output before importing.",
    date: "2026-02-26",
    updatedDate: "2026-10-04",
    readingTime: "5 min read",
    keywords: ["large CSV", "CSV too big for Excel", "edit massive CSV", "filter large csv"],
    content: `For a large CSV file, decide which records and columns you need before loading the whole dataset into a spreadsheet. A browser editor is useful for visual inspection when the data fits available memory. For files that do not, use a CSV-aware streaming script to produce a smaller output.

There is no reliable file-size threshold that works for every machine. Long text fields, wide tables, browser limits and copies held for editing history all affect memory use.

## Separate worksheet limits from memory limits

Excel worksheets support up to 1,048,576 rows, including a header if you put one in the sheet. A valid CSV may contain more records than a worksheet can display. Microsoft's [CSV import documentation](https://support.microsoft.com/en-us/excel/get-started/import-or-export-text-txt-or-csv-files) lists the worksheet import limits.

A smaller file can still strain a machine if its rows are wide. The size on disk is not the same as the memory needed for parsed strings, objects and intermediate results.

## Inspect and filter in csv.repair

[Open the file in csv.repair](/) when it fits your browser's memory. Parsing uses a worker, and the table renders a visible subset of rows. Those features keep rendering work down, but the parsed dataset still occupies memory.

Review the import preview before editing. If it reports [inconsistent field counts](/blog/csv-inconsistent-columns), correct the raw records in the preview or fix the source exporter. Import remains paused until structural issues are resolved.

Use the SQL tab to explore a subset. For a dataset with \`country\` and \`status\` columns:

\`\`\`sql
SELECT * FROM ? WHERE country = 'GB' AND status = 'active'
\`\`\`

Inspect the query result and its count, then choose **Export results** to download that subset. The toolbar export still saves the editor dataset. The [new workflow guide](/blog/csv-import-preview-merge-split-saved-repairs) also explains how to merge files by header name, split loaded data with headers, and reuse saved cleanup rules.

For a deterministic filtered file, the streaming example below writes only matching records.

## Stream a filtered CSV without loading it all into memory

Suppose the source is a UTF-8, comma-delimited file with these columns:

\`\`\`csv
id,country,status,note
001,GB,active,"Call after 5, please"
002,US,active,Email only
003,GB,inactive,Closed
\`\`\`

This Python script preserves those columns, checks the header and record width, and writes active GB records:

\`\`\`python
import csv
from pathlib import Path

source_path = Path("input.csv")
output_path = Path("active-gb.csv")
expected = ["id", "country", "status", "note"]
read_count = written_count = 0

with source_path.open(encoding="utf-8-sig", newline="") as source:
    reader = csv.reader(source, strict=True)
    if next(reader, None) != expected:
        raise ValueError("Unexpected CSV header")
    # Exclusive creation prevents overwriting an existing result.
    with output_path.open("x", encoding="utf-8", newline="") as output:
        writer = csv.writer(output)
        writer.writerow(expected)
        for row in reader:
            read_count += 1
            if len(row) != len(expected):
                raise ValueError(f"Wrong field count near line {reader.line_num}")
            if row[1] == "GB" and row[2] == "active":
                writer.writerow(row)
                written_count += 1

print(f"Read {read_count} records; wrote {written_count}")
\`\`\`

Use your actual schema, delimiter and encoding. If the script fails partway through, the output is incomplete; discard that partial result before rerunning under a new filename. Do not pass it downstream as a completed export.

For the sample, expect three input records and one output record. The output must retain ID \`001\` and the entire note, including its comma.

## Why splitting on lines can damage CSV

A quoted field may contain newlines. A command that splits a file after a fixed number of physical lines can cut a record in half. Selecting columns by splitting on commas has a similar problem when a comma belongs to an address or note.

Use a parser that understands [CSV quoting](/blog/csv-commas-double-quotes). When creating multiple output files, write the header to each and split between parsed records. Count data records separately from header rows.

Python's [CSV module](https://docs.python.org/3/library/csv.html) provides readers and writers for this purpose. You do not need a DataFrame to filter a file one record at a time.

## Verify before doing the next edit

Open the smaller result in csv.repair. Check the header, row count, leading zeros and a record containing punctuation. Compare the count with the script's output and reconcile any business totals that matter.

Then follow the [browser editing walkthrough](/blog/edit-csv-without-excel) for cell corrections or search and replacement. Keep your large source export until the filtered result has passed validation.

[Inspect and clean the CSV subset in your browser](/). Reducing the data first makes the manual work easier to review and leaves a repeatable record of what you selected.`,
  },
];
