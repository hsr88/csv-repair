# CSV blog release, 4 October 2026

Status: implemented and checked locally. Not deployed or submitted for indexing.

## Search Console finding

URL inspection for https://www.csv.repair/blog/how-to-fix-broken-csv-file returned "Crawled - currently not indexed". Last crawl: 18 May 2026. Google discovered the URL through https://www.csv.repair/sitemap.xml; fetching and crawling were allowed. This finding does not establish the reason Google excluded it.

## URLs to request after deployment

Priority: the refreshed repair guide, then the six new articles.

1. https://www.csv.repair/blog/how-to-fix-broken-csv-file
2. https://www.csv.repair/blog/csv-opens-in-one-column-excel
3. https://www.csv.repair/blog/csv-inconsistent-columns
4. https://www.csv.repair/blog/edit-csv-without-excel
5. https://www.csv.repair/blog/csv-commas-double-quotes
6. https://www.csv.repair/blog/csv-leading-zeros-excel
7. https://www.csv.repair/blog/pandas-parsererror-expected-fields-saw

Also refreshed:

- https://www.csv.repair/blog/common-csv-encoding-issues
- https://www.csv.repair/blog/how-to-clean-large-csv-files
- https://www.csv.repair/blog

Verify the deployed content and canonical URL, run URL inspection, then request indexing. Resubmit the sitemap if needed. Requests do not guarantee inclusion or rankings.

## Editorial decisions

Each new article answers a distinct troubleshooting or editing intent. The broad broken-CSV guide links to the detailed fixes. Encoding and large-file advice stays on the existing URLs. Every article includes a concrete example, expected outcome and contextual link to the editor. Table Capture promotion appears in the one-column, browser-editing and broad repair guides, where readers may be starting from a web table.

Humanizer review: removed inflated performance claims, generic conclusions and unsupported automatic-repair promises. Kept ordinary technical language, varied paragraph lengths and specific examples. No invented customer experiences or keyword volumes. Final copy is in client/src/data/csv-guides.ts and client/src/data/refreshed-posts.ts.

Examples of draft-to-final editorial changes from the previous articles:

- Draft: "The command line is your best friend here." Final: "For files that do not, use a CSV-aware streaming script to produce a smaller output." Replaced a slogan with a decision rule.
- Draft: "This is the killer feature for large files." Final: "Use the SQL tab to explore a subset." Removed hype and distinguished query results from editor export.
- Draft: "The tool can attempt to auto-detect and convert corrupted characters." Final: "The Fix Common Encoding Issues template replaces a defined list of common mojibake sequences." Matched the implementation rather than implying universal encoding detection.

## Checks

- PASS: TypeScript (`npm run check`) and production build (`npm run build`).
- PASS: 10 unique article slugs, all in the sitemap; all internal article links resolve to known posts.
- PASS: browser rendering for all articles, code blocks, a numbered procedure, diagnostic table, canonical metadata and article schema.
- PASS: Python snippet syntax; executable standard-library examples for streaming filtering, quoting and field-count diagnosis.
- LIMIT: pandas examples were checked against current documentation and compiled, but not executed because pandas is not installed in the local Python runtime.
- Build emits existing toolchain warnings about Browserslist data, PostCSS source metadata and large chunks.

The site still renders article bodies and article-specific metadata client-side. This change does not introduce static prerendering and cannot guarantee Google indexing.
