import type { BlogPost } from "./blog-posts";

export const workflowRelease: BlogPost = {
  slug: "csv-import-preview-merge-split-saved-repairs",
  title: "New in csv.repair: Import Preview, SQL Export and Reusable Repairs",
  description: "Preview CSV imports, correct malformed records, export SQL results, merge and split files, and save cleanup rules. A practical guide to five new features.",
  date: "2026-10-04",
  readingTime: "6 min read",
  keywords: ["CSV import preview", "export SQL results to CSV", "merge CSV files by column name", "split CSV with headers", "saved CSV repairs"],
  content: `You can now check a CSV before importing it, correct a malformed record beside its original text, and download a filtered SQL result. There are also controls for combining exports, splitting a loaded file and reusing cleanup rules.

The examples below use the controls in this release. CSV processing stays in your browser.

| What you need to do | Where to start |
|--------------------|----------------|
| Choose a separator, encoding or header setting | Load CSV |
| Correct a record with missing fields or broken quotes | The import preview's record issues |
| Download a filtered table | SQL Query → Export results |
| Append exports with different column orders | Merge & Split |
| Break a CSV into smaller files with headers | Merge & Split |
| Repeat the same cleanup on another export | Saved Repairs |

[Open csv.repair](/) and try these steps on a copy of your file.

## Check the CSV import before loading the editor

Choosing **Load CSV** now opens a preview. You can select comma, semicolon, tab or pipe as the delimiter, or leave autodetection on. The preview also lets you choose UTF-8, Windows-1252, Windows-1250, UTF-16 LE or UTF-16 BE.

Start by checking the headers and a value you recognize. If everything appears in one column, change the delimiter. If a name looks wrong, check the source encoding. Those are separate problems; changing the separator will not repair an incorrectly decoded name.

For a file without headers, clear **First record contains headers**. The first record stays in the data, and the columns receive names such as Column 1 and Column 2.

The table previews up to eight valid records. Structural checks run across the file, so the preview is not a claim that only those eight records were checked. If decoding fails, choose the source encoding and try again. Changing encoding rereads the original file and resets any corrections made in the preview.

The [encoding guide](/blog/common-csv-encoding-issues) explains why reopening original bytes matters. Saving already garbled text as UTF-8 can preserve the damage.

## Repair a malformed record beside its original text

An extra comma can move an address into the wrong column. A missing quote can make several records look like one. The import preview now shows the original raw record, the parser's explanation and an editable proposed correction together.

For example, this record is missing its final field:

\`\`\`csv
id,email,note
2,b@example.com
\`\`\`

The preview suggests padding the end with an empty field:

\`\`\`csv
2,b@example.com,
\`\`\`

That suggestion is correct only if the missing value belongs at the end. If the email is missing instead, you must put the empty field in that position. The tool cannot infer which value the source intended.

1. Compare the original record with its headers and the source data.
2. Edit **Proposed correction** if necessary.
3. Choose **Apply correction to preview** to run the checks again.
4. Choose **Import into editor** when the structural issues are resolved.

For extra fields and broken quotes, edit the raw text yourself; the preview does not guess which fields to combine. An unclosed quote may include several intended records in the displayed text. Restore their boundaries before applying the correction.

Import stays paused while record issues remain. Invalid records are not silently dropped into a partial export. For a file with many errors, the preview shows up to 100 at a time. Fixing the exporter may be faster than correcting each record. See the [column mismatch examples](/blog/csv-inconsistent-columns) and [CSV quoting guide](/blog/csv-commas-double-quotes) for common causes.

## Export SQL results as their own CSV

The **SQL Query** tab now has an **Export results** button. It downloads the rows and columns returned by the query, including aliases and calculated values.

Suppose your export has an email column and a status column:

\`\`\`sql
SELECT email, status
FROM ?
WHERE status = 'active'
\`\`\`

Run the query, check its row count, then select **Export results**. Choose the locale preset and optional UTF-8 BOM in the export dialog. The downloaded filename starts with **query_**.

The main toolbar's **Export** still downloads the editor's dataset. Running a query does not replace that dataset. The two buttons serve different purposes, so use the result button when you want the filtered output. A query returning zero rows has no downloadable result in this version.

## Merge CSV files by column name

Open **Merge & Split**, then choose the files to merge. The import preview checks them before combining their records. If you already have data in the editor, you can include it or clear **Include current editor data**.

Columns are matched by their exact header names. A file containing **id,name** and another containing **name,id,note** produce the combined columns **id,name,note**. Records from the first file receive an empty note. No column needs to be discarded just because another file does not contain it.

This operation appends rows. It does not join two tables on an ID, resolve conflicting values or remove duplicates. Header names are case-sensitive: **Email** and **email** remain separate columns. Rename them consistently before merging if they mean the same thing.

Import settings apply to the selected files together. If they use different encodings or separators, normalize them separately first. The preview lists the append order; current editor data comes first when included.

## Split a CSV without breaking multiline fields

In **Merge & Split**, enter **Data rows per file** and select **Prepare split files**. Each part has its own download button. Every part includes the headers, uses UTF-8 with comma separators, and keeps quoted multiline fields together.

A note containing three line breaks still counts as one data record. Splitting by raw text lines could cut that note in half; splitting the parsed records preserves the cell.

The control prepares at most 1,000 parts. Choose a larger number of rows per part if you reach that limit. Parts are downloaded individually rather than as a ZIP archive.

The whole dataset must fit in browser memory before it can be split here. For files that cannot be loaded on your device, use the streaming approach in our [large CSV guide](/blog/how-to-clean-large-csv-files).

## Save the cleanup you repeat every month

**Saved Repairs** lets you arrange cleanup steps, preview their effect and save the rules for the next file. Available steps are trimming whitespace, removing empty rows, removing duplicates and lowercasing a selected column.

For a contacts export, you could trim whitespace first, lowercase the email column second, then remove duplicates by email. Order matters: deduplicating before trimming can leave two values that differ only by trailing spaces.

Choose **Preview changes** to compare the first eight rows before and after, along with the full row counts. **Apply repair set** changes the editor and creates one undo step. Duplicate removal keeps the first matching record, so review which columns should define a duplicate.

Give the set a name and choose **Save repair set**. Saving with the same name replaces that set. Rules stay in this browser across reloads; CSV contents are not saved with them. Clearing browser storage removes the sets, and they do not sync to another device. If a required column is missing from the next file, preview stops with an explanation and leaves the data unchanged.

## Try the workflow on one real export

Keep the original, check the import settings, resolve record issues, then run the cleanup you need. After exporting, reopen the result and compare its record count, headers and a few known values with your expectations.

If your starting point is a web table, our [Table Capture & Extractor Chrome extension](https://chromewebstore.google.com/detail/table-capture-extractor/hmehfffhilmehojjlkoogagjmkdoddlk) can capture it and export a CSV. Check the captured table before bringing that file into csv.repair.

[Try the new CSV tools](/). Start with the import preview, then save a repair set if the same cleanup is likely to come back next month.`,
};
