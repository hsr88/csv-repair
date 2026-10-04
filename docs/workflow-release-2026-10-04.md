# CSV workflow release — 2026-10-04

## Implemented

- SQL result-specific export with locale options and optional BOM.
- Import preview with delimiter, encoding and header controls; worker parsing.
- Raw record correction, original text and diagnostics, explicit apply and revalidation. Import is blocked until structural errors are resolved.
- Multi-file append by exact column name, with optional current dataset.
- Record-aware split downloads with repeated headers.
- Ordered, locally saved repair sets, before/after preview and one-step undo.

## Verification

- TypeScript: `npm run check`.
- Regression suite: `npm test` (12 cases, including 100,001 records).
- Production build: `npm run build`.
- Chrome against the production build: malformed record repair retained all 3 records, including multiline fields; SQL download contained only the selected 2 columns and 1 filtered row; merge produced 4 correctly aligned columns and 4 rows; both downloaded split files contained 2 records and their headers.
- Browser import: invalid UTF-8 blocked decoding, selecting Windows-1252 restored André; headerless mode retained the first record; two files could be selected and merged before loading any editor data.
- Saved repairs: trim, lowercase and deduplication changed 3 rows to 2; undo restored all 3 original rows; saved rules survived reload; missing email column stopped preview without mutation.
- Mobile: 390px viewport, repair controls usable with sidebar collapsed, no page horizontal overflow.
- Blog: rendered title, one H1, canonical and meta description checked in Chrome. Sitemap includes the article.

## Limits

The dataset must fit in browser memory. Import settings apply to all files selected for a merge. Header matching is exact and case-sensitive. Split files are individual UTF-8/comma downloads, with at most 1,000 parts. Saved sets store rules in the current browser, not CSV data or cloud copies. Short-record padding is a suggestion that users must verify. Empty SQL results have no export button action.

Existing build warnings remain for Browserslist data, a PostCSS plugin and large bundles.

## Editorial review

Draft retained locally in `.local/workflow-article-draft.md`; final article is `client/src/data/workflow-release.ts`.

Humanizer audit: the draft opening stacked three hypothetical situations and then repeated the feature list. The final opening states the new controls directly and removes that repetition. Kept actual UI labels, examples, row counts and limits. No invented customer outcomes, unsupported speed claims or automatic recovery claims.

Publication URL: https://www.csv.repair/blog/csv-import-preview-merge-split-saved-repairs
