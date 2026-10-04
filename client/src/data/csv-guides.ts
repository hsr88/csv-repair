import type { BlogPost } from "./blog-posts";

export const csvGuides: BlogPost[] = [
  {
    slug: "csv-opens-in-one-column-excel",
    title: "CSV Opens in One Column in Excel? How to Fix It",
    description: "Fix a CSV that opens in one Excel column. Check commas, semicolons and import settings, then verify your columns before saving the file.",
    date: "2026-10-04",
    readingTime: "5 min read",
    keywords: ["csv opens in one column excel", "csv not separating into columns", "semicolon csv excel"],
    content: `If your CSV opens in one column in Excel, check the delimiter first. Excel may be expecting commas while your file uses semicolons. Import the file through **Data > From Text/CSV** and select the separator that puts each header in its own column.

You usually do not need to rewrite the file. A correct CSV can look broken when the application reads it with the wrong settings.

## Check what is actually in the file

Open a copy in a plain text editor. This example uses semicolons between its three fields:

\`\`\`csv
product;price;stock
Notebook;4,50;12
Pencil;1,20;48
\`\`\`

Here, the comma belongs to the price. Replacing every semicolon with a comma would create ambiguous rows unless you also quote or convert those prices correctly. Avoid a global find-and-replace on the raw file.

With the correct separator, the first data record should be:

| product | price | stock |
|---------|-------|-------|
| Notebook | 4,50 | 12 |

For comparison, a comma-separated version with decimal points would be:

\`\`\`csv
product,price,stock
Notebook,4.50,12
Pencil,1.20,48
\`\`\`

Both can be valid inputs for an application configured to read them. The extension alone does not tell Excel which convention the producer used.

## Import with the right separator

In desktop Excel versions with the text/CSV importer:

1. Open a blank workbook and choose **Data > From Text/CSV**.
2. Select the original CSV file.
3. Choose the delimiter shown in the file, such as semicolon or comma.
4. Inspect the preview before loading. Each header should occupy a separate column.
5. If you have identifiers or postal codes, choose **Transform Data** and keep those columns as text before loading.

Menu names and available options vary by Excel version. Microsoft's [text and CSV import instructions](https://support.microsoft.com/en-us/excel/get-started/import-or-export-text-txt-or-csv-files) cover the supported import routes.

If the data is already in column A, **Data > Text to Columns > Delimited** can split it. Start from a fresh import if Excel has already changed values such as dates or identifiers; splitting columns will not undo those conversions.

## Check the file without relying on Excel's defaults

[Open the CSV in csv.repair](/) to inspect its headers and values in a browser. Parsing happens locally. The import preview attempts to detect the delimiter and lets you override it before importing. It also shows structural issues that must be resolved.

If the preview has the expected columns, the original problem is likely the Excel import configuration. You can keep the original file and fix the importer, or export a separate copy using the delimiter required by the receiving system. Review the decimal separator in the export options too.

Do not export yet if values have shifted into neighboring columns. An extra comma inside an unquoted address needs a different fix; see [CSV rows with too many or too few columns](/blog/csv-inconsistent-columns).

## What if it still opens in one column?

- **The entire record is quoted:** A line such as \`"name,email,city"\` represents one field in comma-delimited CSV. Check whether the export accidentally wrapped every whole record.
- **The separator is a tab:** Choose tab as the delimiter. Our [CSV and TSV comparison](/blog/csv-vs-tsv-difference) explains the distinction.
- **Only some records break:** Inspect [quotes and commas inside fields](/blog/csv-commas-double-quotes).
- **Columns work but names look wrong:** Follow the [encoding guide](/blog/common-csv-encoding-issues); delimiter settings will not repair garbled characters.

## Verify before you send it

For the sample above, expect three columns and two data records. Check that the price remains a single value, then reopen your exported copy with the intended delimiter. For your own file, also inspect a record containing punctuation and one near the end.

If the data started as a web table, our [Table Capture & Extractor Chrome extension](https://chromewebstore.google.com/detail/table-capture-extractor/hmehfffhilmehojjlkoogagjmkdoddlk) can capture the table and export CSV, avoiding manual copy-and-paste between columns. Check the captured preview before exporting.

[Check your CSV's columns in csv.repair](/), then export only after the preview matches the source.`,
  },
  {
    slug: "csv-inconsistent-columns",
    title: "How to Fix CSV Rows with Too Many or Too Few Columns",
    description: "Find CSV rows with inconsistent column counts. Fix missing fields, extra delimiters and unquoted commas without silently dropping records.",
    date: "2026-10-04",
    readingTime: "6 min read",
    keywords: ["csv inconsistent number of columns", "csv too many fields", "fix malformed csv rows"],
    content: `A CSV row with too many or too few columns usually has an extra delimiter, a missing field separator, or a quoting problem. Compare the affected record with the header, then correct the source of the mismatch. Deleting the record may make an import succeed, but it also removes data.

Start with a copy of the original file. A parser can report where it became confused; it cannot always tell you what the author intended.

## A comma inside an address creates an extra field

This sample has three headers, but the first data record contains four fields:

\`\`\`csv
id,address,city
101,12 King Street, Apt 4,London
102,8 Oak Road,Bristol
\`\`\`

If the source confirms that the apartment number belongs to the address, quote that complete value:

\`\`\`csv
id,address,city
101,"12 King Street, Apt 4",London
102,8 Oak Road,Bristol
\`\`\`

The corrected first record has three fields. Its address still contains a comma, which is now data inside a quoted field. See the [quoting guide](/blog/csv-commas-double-quotes) for quotes and embedded newlines.

Do not remove every comma from an address column. That changes the values and may still leave the file structurally wrong.

## A missing value still needs its separator

Suppose your schema is \`id,email,country\`. This record has only two fields:

\`\`\`csv
id,email,country
101,GB
\`\`\`

If the email is missing and GB is the country, the correct record is:

\`\`\`csv
id,email,country
101,,GB
\`\`\`

The empty field between the commas keeps the country in the third position. If you merely append a comma to the broken record, you get \`101,GB,\`, which puts GB in the email column. Both versions have three fields; only one matches the intended data.

That is why padding short rows without checking the source is risky. A correct column count is necessary, but it is not proof that values are aligned.

## Diagnose the mismatch in csv.repair

[Load a copy in csv.repair](/) and review the import preview. Check the parser explanations alongside the headers, valid records and raw text of each reported issue.

For an extra-field warning, compare the original record with the proposed correction. Edit the raw text to restore the intended fields, then choose **Apply correction to preview**. The app checks the file again and keeps import paused while issues remain.

You can correct structural damage in the preview, in a text editor, or in the upstream exporter. A short-record suggestion adds empty fields at the end; move them if the missing value belongs elsewhere. Inline editing is useful once each value is mapped to its proper column. **Auto-Repair** trims whitespace and removes empty rows; it cannot decide where an unknown missing value belongs.

For a wider diagnosis, use the [broken CSV repair checklist](/blog/how-to-fix-broken-csv-file).

## Check these less obvious causes

- **Trailing separators:** \`101,alice@example.com,GB,\` has a fourth, empty field. Remove the final separator only when the schema confirms there are three fields.
- **Wrong delimiter:** Reading a semicolon file as comma-separated data can produce misleading field counts. If every row looks wrong, [check the delimiter first](/blog/csv-opens-in-one-column-excel).
- **Unclosed quotes:** One missing quote can make a parser consume several physical lines as one record. Inspect the record before the reported failure as well.
- **Combined exports:** Two files may have different headers or column orders. Align them to one schema before concatenating records.
- **Duplicate header names:** Distinct columns need distinct names if you want reliable lookups and editing. Check the source schema before renaming them.

## Find mismatched records with Python

For a UTF-8, comma-delimited file, this script reports mismatches without rewriting or skipping records:

\`\`\`python
import csv

with open("input.csv", encoding="utf-8-sig", newline="") as source:
    reader = csv.reader(source, delimiter=",", strict=True)
    try:
        header = next(reader)
        for record_number, row in enumerate(reader, start=2):
            if len(row) != len(header):
                print(record_number, reader.line_num, len(row), row)
    except StopIteration:
        raise SystemExit("The file is empty")
    except csv.Error as error:
        print("Parse error near physical line", reader.line_num, error)
\`\`\`

Choose the actual encoding and delimiter for your file. The output includes a logical record number and the physical line where that record ends. They differ when a quoted field contains newlines. Python documents this behavior in its [CSV reader reference](https://docs.python.org/3/library/csv.html).

## Confirm that the repair preserved the data

Reload the corrected file and check the warnings again. Compare the number of logical records with the source export, inspect the repaired rows, and check identifiers for unexpected blanks or duplicates. If the file has amounts, compare totals too.

For the address sample, expect two data records with three fields each. Record 101 must retain the full apartment address. For the missing-email sample, expect an empty email and GB in the country column.

[Inspect your repaired CSV in the browser](/) before importing it into the next system.`,
  },
  {
    slug: "edit-csv-without-excel",
    title: "How to Edit a CSV File Without Excel",
    description: "Edit a CSV without Excel using a local browser editor. Change cells, find and replace values, check errors and export a separate CSV copy.",
    date: "2026-10-04",
    readingTime: "5 min read",
    keywords: ["edit csv file without excel", "edit csv in browser", "how to edit a csv file"],
    content: `You can edit a CSV file without Excel by opening it in a browser CSV editor, changing the cells, and exporting a new copy. Use a plain text editor for a small structural correction, or a script when you need a repeatable transformation across many files.

For a one-off edit, [open csv.repair](/). CSV parsing and editing happen on your device; the file is not uploaded to a server.

## Work through a small example first

Save this sample as \`contacts.csv\` using UTF-8:

\`\`\`csv
id,name,email
00127,Ada,ada@old.example
00128,Leo,leo@old.example
\`\`\`

The task is to update the email domain while keeping the identifiers unchanged. The expected result is:

\`\`\`csv
id,name,email
00127,Ada,ada@new.example
00128,Leo,leo@new.example
\`\`\`

Those leading zeros matter. They are part of the identifier, not decoration. A program that converts the column to numbers may change \`00127\` to \`127\`.

## Open the file and check its structure

Drag the CSV into csv.repair or use **Load CSV**. Look at the headers and a few records before making changes. The sample should show three columns and two records.

Resolve any import preview warnings first. If an address has spilled into the next column, fix that [column mismatch](/blog/csv-inconsistent-columns) before starting a bulk edit. A table can look tidy while some values are mapped incorrectly.

For an unfamiliar export, keep the original file and write down the expected record count. That gives you something concrete to compare with your result.

## Change a cell or replace repeated text

Double-click a cell, enter its replacement, and press Enter to save. Escape cancels the current edit. Use Undo if you committed the wrong value.

For the sample, open **Search & Replace** and search for \`@old.example\`. Review the matches, then replace them with \`@new.example\`. Searching for the complete domain is more precise than searching for the word \`old\`, which could also occur in names or notes.

Search and replacement apply across the data, so review every affected column. If the same text appears in a notes field that should remain unchanged, edit the email cells individually instead.

You can also use the repair templates for tasks such as trimming whitespace. Apply one change at a time and inspect the result. Trimming is useful for accidental spaces around email addresses, but spaces may be meaningful in other kinds of data.

## Export a new file

Choose **Export** after checking the edited cells. Match the delimiter and decimal settings to the destination application. Enable the UTF-8 BOM option if your receiving workflow needs it; the [encoding guide](/blog/common-csv-encoding-issues) explains what that marker does.

Keep the original and the repaired copy until you have verified the import. The exported CSV may quote fields differently from the input while preserving the same parsed values. Compare the table contents, not just the raw punctuation.

For the sample, reload the exported file and confirm:

- There are still two data records and three columns.
- Both emails end in \`@new.example\`.
- The identifiers remain \`00127\` and \`00128\`.
- The names have not changed.

If you later open the file in Excel, [import identifier columns as text](/blog/csv-leading-zeros-excel). Quoting a number in CSV does not force Excel to preserve it as text.

## When a text editor or script is a better fit

A text editor is useful when one record has a missing closing quote and you need to inspect the raw structure. It becomes awkward when a field contains a comma or spans multiple lines: moving the wrong quote changes how the rest of the file is read.

For recurring trim, empty-row removal, duplicate removal or lowercase rules, use [Saved Repairs](/blog/csv-import-preview-merge-split-saved-repairs). Use a script for transformations beyond those steps, with validation checks that fail visibly on unexpected headers.

For very large files, available memory matters more than whether you have Excel installed. The [large CSV guide](/blog/how-to-clean-large-csv-files) covers filtering before editing and processing records in a stream.

## If your data is still on a webpage

Our [Table Capture & Extractor extension](https://chromewebstore.google.com/detail/table-capture-extractor/hmehfffhilmehojjlkoogagjmkdoddlk) captures web tables and lets you edit cells in Table Studio before exporting. Use it when the starting point is a table on a site; use csv.repair when you already have a CSV file.

[Open your CSV and make the first edit](/). Start with one cell, check the export, then apply the rest of your changes.`,
  },
  {
    slug: "csv-commas-double-quotes",
    title: "How to Fix Commas and Double Quotes Inside CSV Fields",
    description: "Learn how CSV escapes commas, double quotes and line breaks. Use before-and-after examples to fix malformed fields and verify the exported data.",
    date: "2026-10-04",
    readingTime: "5 min read",
    keywords: ["escape double quotes in csv", "csv comma inside field", "fix csv quotes"],
    content: `To keep a comma inside a CSV field, wrap the entire field in double quotes. To keep a double quote inside that quoted field, write it twice. A field containing a newline also needs quoting in the common comma-delimited format.

These rules let a parser distinguish punctuation in your data from punctuation that separates fields. They are described in [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180), although individual importers may support different CSV dialects.

## Keep a comma inside one cell

This record is ambiguous because the address contains an unquoted comma:

\`\`\`csv
id,address,status
7,24 Market Road, Unit 2,active
\`\`\`

The header has three fields. The data record has four. If the address is meant to include the unit number, write:

\`\`\`csv
id,address,status
7,"24 Market Road, Unit 2",active
\`\`\`

The parsed address is \`24 Market Road, Unit 2\`. The surrounding quotes are CSV syntax and should not appear as part of the displayed cell value.

## Escape a double quote by doubling it

Suppose a note should read \`She said "yes", then left\`. The complete CSV record is:

\`\`\`csv
id,note
7,"She said ""yes"", then left"
\`\`\`

The outer pair encloses the field. Each doubled quote inside it represents one literal quote in the value. Do not add backslashes unless your specific importer documents a backslash escape convention. Escaping a string for JSON or a programming language is a separate step from escaping the resulting CSV.

When entering a note in csv.repair's cell editor, type the normal value: \`She said "yes", then left\`. The exporter handles CSV quoting. Typing doubled quotes into the cell itself would put extra quotes in your actual data.

## A newline can belong to a field

This is a two-column CSV containing one data record:

\`\`\`csv
id,note
7,"Leave at reception.
Call on arrival."
\`\`\`

The note spans two physical lines. A parser keeps them together because the field is quoted. A tool that splits the file at every newline will break that record.

This is also why counting lines in a text editor is not always the same as counting CSV records. When you [process a large file](/blog/how-to-clean-large-csv-files), use a CSV-aware reader for splitting or filtering records.

## Repair the source before exporting a misparsed table

[Open a copy in csv.repair](/) and check the parser warnings. If the fields line up correctly and you only need to change the text, edit the cell and export.

If an unclosed quote has merged several records, inspect the original raw text shown in the import preview. Locate the intended field boundary, correct the quote in **Proposed correction**, and apply it to rerun the checks. Restore all intended records in that text. Import stays paused until the reported structural issues are resolved.

For a report about too many fields, compare the header with the original record. Our [inconsistent columns guide](/blog/csv-inconsistent-columns) walks through the difference between an extra delimiter and a missing value.

Avoid these shortcuts:

- Removing every quote from a file with commas inside fields.
- Replacing all commas when some are part of addresses or descriptions.
- Adding a closing quote at the end of the file without finding where the quoted value should have ended.
- Treating every newline as a new record.

## Let a CSV writer handle escaping in scripts

Python's CSV writer handles commas, quotes and newlines in field values:

\`\`\`python
import csv

with open("notes.csv", "w", encoding="utf-8", newline="") as output:
    writer = csv.writer(output)
    writer.writerow(["id", "note"])
    writer.writerow(["7", 'She said "yes", then left'])
\`\`\`

Use the corresponding [CSV reader and writer](https://docs.python.org/3/library/csv.html) rather than joining values with commas yourself. Match delimiter and quote settings when the receiving system expects a different dialect.

## Test the round trip

Reload the exported file and inspect the parsed cells. The address example must have three columns. The note must contain one quote on each side of yes. The multiline example must remain one data record with a line break inside its note.

Textually different CSV files can represent the same table: quoting every field is usually valid even when some fields do not need quotes. What matters is that the receiving application reconstructs the intended values.

[Check the parsed values in csv.repair](/) before sending the file. If you are unsure which issue caused the failure, start with the [broken CSV diagnosis guide](/blog/how-to-fix-broken-csv-file).`,
  },
  {
    slug: "csv-leading-zeros-excel",
    title: "How to Keep Leading Zeros in CSV Files in Excel",
    description: "Stop Excel removing leading zeros from CSV identifiers. Import columns as text, check the original values and avoid fixes that only change the display.",
    date: "2026-10-04",
    readingTime: "5 min read",
    keywords: ["csv leading zeros removed", "keep leading zeros csv excel", "csv postal codes excel"],
    content: `To keep leading zeros when opening a CSV in Excel, import the identifier column as **Text** before Excel converts its values to numbers. Formatting the column afterward may change how a number looks, but it does not tell you which digits were originally present.

First inspect the original CSV in a text editor or [csv.repair](/). If it still contains \`00127\`, the file may be fine and the Excel import is what needs changing.

## Check whether the zeros are still in the CSV

Use this small example:

\`\`\`csv
customer_id,postal_code,amount
00127,02108,49.50
00128,00501,12.00
\`\`\`

Here, \`customer_id\` and \`postal_code\` are identifiers. Their digits are labels, not quantities you need to add together. The amount is a number.

The correct imported table should keep \`00127\` and \`02108\` exactly as written. If Excel shows \`127\` and \`2108\`, inspect the original file before saving over it. Saving converted values back to CSV can make the change permanent in that copy.

## Import identifier columns as text

In Excel versions with Power Query:

1. Open a blank workbook and choose **Data > From Text/CSV**.
2. Select the CSV and confirm the delimiter in the preview.
3. Choose **Transform Data** before loading into the worksheet.
4. Check the **Applied Steps** pane. If an automatic **Changed Type** step has converted the identifiers to numbers, remove or edit that step first.
5. Set the identifier and postal-code columns to **Text**, then load the result.

Converting an already shortened numeric value back to text gives you \`127\`, not \`00127\`. The text type needs to apply before the destructive conversion.

Microsoft's guide to [keeping leading zeros and large numbers](https://support.microsoft.com/en-us/excel/keeping-leading-zeros-and-large-numbers) describes the available options. Versions with the older Text Import Wizard also let you set a column's format to Text during import.

## Why double quotes do not solve it

You might try exporting the identifier as \`"00127"\`. In CSV, those quotes define the field boundary. They do not declare a text data type for Excel.

A CSV file has no workbook cell-format metadata. The receiving application still decides how to interpret the parsed value. The [CSV quoting guide](/blog/csv-commas-double-quotes) covers what quotes do preserve: commas, quote characters and line breaks inside fields.

Avoid turning identifiers into formulas such as \`="00127"\` just to influence Excel. That changes the field's contents and can break imports into other systems. A correctly configured text import keeps the original value portable.

## Check and edit identifiers before the Excel import

csv.repair reads CSV fields as strings in its editor, so an intact identifier such as \`00127\` remains available for inspection and editing. Load the example and check the first two columns before applying any cleanup.

Export a separate copy, then reopen it and inspect the identifiers again. Your next Excel import still needs text columns. Exporting from a CSV editor cannot force every receiving application to use the right data type.

If you only need to correct an email or a name, you can [edit the CSV without Excel](/blog/edit-csv-without-excel) and avoid that conversion step altogether.

## Can you restore zeros after they were removed?

You need either the original data or a known field-width rule. If every customer ID is defined as exactly five digits, padding \`127\` to \`00127\` may be appropriate after checking that rule. If lengths vary, there is no reliable way to infer whether the source was \`127\`, \`0127\` or \`00127\`.

A custom number format such as \`00000\` is useful for display in a workbook. It is not evidence that the original identifier has been recovered, and you should inspect any exported CSV separately.

Long identifiers need similar care. Once a spreadsheet has changed significant digits through numeric conversion, adding zeros or changing the display format cannot reconstruct those digits. Return to an unmodified export.

## Verify the actual output

For the sample, check that both customer IDs contain five characters and the postal codes remain \`02108\` and \`00501\`. Check the raw exported file as well as the worksheet display.

For a real export, inspect several identifiers with different numbers of leading zeros and compare them with the source system. Do not use one visually correct cell as proof that the whole column is intact.

[Inspect your CSV identifiers before opening Excel](/). Keep an untouched original so you can always repeat the import with the right settings.`,
  },
  {
    slug: "pandas-parsererror-expected-fields-saw",
    title: "Pandas ParserError: Expected X Fields, Saw Y",
    description: "Fix pandas CSV tokenizing errors by checking delimiters, quotes and malformed records. Diagnose Expected X fields, saw Y without silently skipping data.",
    date: "2026-10-04",
    readingTime: "6 min read",
    keywords: ["pandas error tokenizing data", "pandas expected fields saw", "pandas parsererror csv"],
    content: `The pandas error \`Expected X fields in line N, saw Y\` means the parser encountered more fields than it expected under the current read settings. Check the delimiter and quote rules, then inspect the failing record. The problem can be in the file or in how you call \`read_csv\`.

Keep \`on_bad_lines="error"\` while diagnosing. Silencing the error can leave you with a DataFrame that is missing records.

## Reproduce a column-count failure

This example establishes three columns, then supplies an unquoted comma in an address:

\`\`\`python
from io import StringIO
import pandas as pd

source = StringIO('''id,address,city
1,8 Oak Road,Bristol
2,12 King Street, Apt 4,London
''')
df = pd.read_csv(source)
\`\`\`

The second data record has four fields. If the source address includes the apartment number, its corrected CSV form is:

\`\`\`csv
id,address,city
1,8 Oak Road,Bristol
2,"12 King Street, Apt 4",London
\`\`\`

Read the corrected file and check that it has two records, three columns, and the complete address in one cell. Exact error wording can differ by pandas version and parser engine.

## Check the delimiter before editing any records

If the export uses semicolons, tell pandas explicitly:

\`\`\`python
df = pd.read_csv("input.csv", sep=";", dtype=str, keep_default_na=False)
\`\`\`

Use the separator you observed in the source. Do not change \`sep\` repeatedly until one version happens to load; a one-column DataFrame may simply contain unsplit records.

With \`dtype=str\`, this diagnostic read avoids converting identifiers to numbers. \`keep_default_na=False\` preserves strings such as NA instead of treating them as missing values. Decide on production types and missing-value rules separately, after checking the schema.

The [pandas read_csv reference](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html) documents these options and their defaults.

## Inspect the failing record and the one before it

An extra separator can be an unquoted comma in an address, description or currency value. A missing closing quote can affect later lines, so the reported location is a starting point rather than a guarantee of where the mistake began.

Use a CSV-aware reader when checking field counts. Splitting each physical line with \`line.split(",")\` will miscount commas inside quoted fields and mishandle multiline values.

The [inconsistent-columns guide](/blog/csv-inconsistent-columns) includes a small inspection script that prints mismatched records without modifying the file. If quoting is the cause, compare the source with these [comma and double-quote examples](/blog/csv-commas-double-quotes).

## Match the exporter's quote convention

For ordinary comma-delimited CSV, pandas already expects double quotes as the quote character and doubled quotes inside quoted values. Change those settings only when the exporter uses another documented dialect.

Switching to \`engine="python"\` may be appropriate for features that require it, but it does not establish that malformed input has been repaired. Always inspect the resulting columns and values. Similarly, disabling quoting can turn commas inside descriptions into extra fields.

If the error is instead \`UnicodeDecodeError\`, investigate the [file's encoding](/blog/common-csv-encoding-issues). It is a different failure from a field-count mismatch.

## Why skipping bad lines is not a repair

The \`on_bad_lines="skip"\` option can omit records with too many fields. Use it only when discarding those records is an explicit decision and you have a separate way to account for what was excluded.

It is not a complete schema validator. Short records may be padded with missing values, and some input shapes can lead to unexpected index interpretation. A successful read is therefore only the first check.

For a known schema, validate the result explicitly:

\`\`\`python
expected_columns = ["id", "address", "city"]
df = pd.read_csv("corrected.csv", dtype=str, keep_default_na=False)

if df.columns.tolist() != expected_columns:
    raise ValueError("Unexpected CSV columns")
if not isinstance(df.index, pd.RangeIndex):
    raise ValueError("Unexpected index: inspect the input structure")
if df["id"].eq("").any() or df["id"].duplicated().any():
    raise ValueError("Missing or duplicate IDs")
\`\`\`

The uniqueness check suits this example's ID field; adapt it to your actual schema. Compare the row count with an independent source count when one exists. For financial exports, reconcile totals as well.

## Use a visual check when the file is unfamiliar

[Inspect the CSV in csv.repair](/) to review its headers, parser warnings and values locally in the browser. If structural errors have shifted or merged fields, correct the raw records in the import preview or fix the source exporter. The editor import stays paused until those reported errors are resolved.

After repairing the source, rerun the original pandas import and your validation checks. For files that exceed available memory, follow the [large-file workflow](/blog/how-to-clean-large-csv-files) and validate in chunks.

[Check the suspect CSV before changing your import code](/). Confirm what the file contains, then make the smallest correction that preserves every intended record.`,
  },
];
