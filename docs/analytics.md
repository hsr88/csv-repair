# GA4: faktyczne użycie csv.repair

Wdrożenie: 10.10.2026. Usługa csvrepair (525806252), strumień csv (13660739913), G-R39FXG3NW8.

Zmiana 12.10.2026 na żądanie właściciela: analityka działa domyślnie od wejścia, z możliwością wyłączenia. Zapisane odmowy pozostają respektowane. Nie porównuj bezpośrednio okresu opt-in 10–12 października z okresem po tej zmianie.

## Raport

Zapisany w GA4: CSV repair — faktyczne użycie narzędzia (16101612619).
Opublikowany w menu: Raporty → CSV repair → Użycie narzędzia.
[Otwórz raport](https://analytics.google.com/analytics/web/#/a9638488p525806252/reports/explorer?collectionId=16101790136&r=16101612619).
Zarejestrowano wszystkie dziewięć parametrów jako niestandardowe wymiary zdarzeń.
Wiersze: nazwa wydarzenia. Metryki: całkowita liczba użytkowników, liczba zdarzeń, sesje.
Filtr obejmuje tylko osiem poniższych zdarzeń. Nie ma danych historycznych o tych działaniach.

| Zdarzenie | Kiedy |
| --- | --- |
| tool_opened | Otwarta główna strona edytora, gdy analityka nie jest wyłączona |
| file_selected | Plik/pliki przekazane do podglądu; nie kliknięcie przycisku wyboru |
| import_completed | Poprawne dane przekazane do edytora |
| import_error | Kategoria encoding/structure/parser; raz na kategorię na otwarty podgląd |
| import_cancelled | Jawne zamknięcie/anulowanie podglądu przed importem |
| record_corrected | Poprawka wpisana do podglądu; ostateczną walidację potwierdza import_completed |
| feature_used | Wykonana operacja, z parametrami feature i outcome |
| export_created | Plik wygenerowany i uruchomione pobieranie; nie potwierdzenie zapisu na dysku |

feature: cell_edit, structure_edit, replace, auto_repair, template, sql, merge, split, recipe_save, recipe_apply.
outcome: success, error, no_changes. SQL z błędem nie oznacza udanego użycia.
export_type: editor, sql, split. split liczy każde pobranie części; feature=split liczy przygotowanie podziału.

## Jak czytać

- import_completed pokazuje mierzalnych użytkowników, którzy wczytali poprawne dane.
- feature_used oraz export_created pokazują pracę i dotarcie do wyniku.
- Liczba zdarzeń to operacje, nie osoby. Jeden użytkownik może wykonać wiele eksportów.
- Użytkownicy to rozpoznane przeglądarki/identyfikatory cookies, nie zweryfikowane osoby.
- Sesje i użytkownicy poszczególnych wierszy nie sumują się: ta sama sesja może przejść kilka etapów.
- Iloraz sesji import_completed/tool_opened lub export_created/import_completed jest orientacyjnym wskaźnikiem. Dokładny lejek wymaga kolejności zdarzeń w eksploracji GA4.
- Dodaj wymiar dodatkowy CSV funkcja, CSV wynik operacji, CSV rodzaj eksportu, kategoria urządzenia lub sesja–źródło/medium, aby zobaczyć przekroje.
- Powroty analizuj jako kohorty użytkowników z import_completed, a nie wszystkich czytelników bloga. 7/30 dni wymaga zebrania odpowiednio długiej historii.
- Nie wnioskuj o gotowości do zapłaty z samych kliknięć. Szukaj powrotów oraz regularnych eksportów po konkretnych funkcjach.

## Prywatność i ograniczenia

Od 12.10.2026 tag Google ładuje się domyślnie, chyba że csv-analytics-consent-v2 zawiera declined. Brak wyboru nie jest zapisywany jako świadoma akceptacja. Baner informuje o domyślnym pomiarze. Cookie settings pozwala go wyłączyć bez przeładowania i utraty CSV. Wyłączenie ustawia ga-disable, odmawia analytics_storage i usuwa cookies _ga. Zmiana synchronizuje się między kartami. W razie niedostępności localStorage wybór działa w pamięci bieżącej karty.

Reklamowe zgody pozostają denied, Google Signals i personalizacja reklam wyłączone w kodzie. Automatyczny pomiar zaawansowany GA4 wyłączono za osobną zgodą właściciela, by nie zbierał nazw pobrań, tekstów/formularzy ani zdublowanych odsłon SPA.

Wysyłane są wyłącznie dozwolone kategorie. Nie wysyłamy nazw plików/kolumn, wartości komórek, SQL, wyszukiwań ani nazw zestawów. URL bez query/hash; referrer ograniczony do origin. Konsekwencją usunięcia query jest brak atrybucji UTM; podstawowy referrer pozostaje dostępny.

Parametry: feature, outcome, export_type, error_category, size_bucket (łączny rozmiar wybranych plików), row_bucket, column_bucket, file_count, duration_bucket. Czas importu/anulowania obejmuje pracę w podglądzie i decyzję użytkownika; SQL obejmuje wykonanie i załadowanie modułu. Są to przedziały, nie dokładne wartości.

Odmowy, blokery i zamknięcia kart powodują niepełny pomiar. import_cancelled nie próbuje niezawodnie mierzyć zamknięcia przeglądarki; porzucenie oceniaj także przez brak kolejnego etapu. Zmiana zgody w środku operacji może dać import bez file_selected. Lokalny development i preview nie wysyłają danych do produkcyjnego GA4. Raporty i definicje niestandardowe potrzebują czasu na przetworzenie nowych danych.

## Walidacja

npm run check; npm run build; npm test.
Testy analytics sprawdzają domyślny start bez kliknięcia banera, powrót z zapisaną odmową, brak duplikatów, whitelist parametrów, wycofanie i synchronizację między kartami, niedostępność storage, przedziały i odporność na błąd tagu.
Test UI: odmowa → import 3 rekordów → zmiana zgody bez utraty danych → SQL → eksport → wycofanie zgody.

Historyczna walidacja wdrożenia 10.10: TypeScript, build i 20 testów zakończone powodzeniem. Na produkcji sprawdzono ówczesną blokadę tagu przed zgodą i po odmowie oraz import, automatyczną naprawę i eksport pliku testowego. W GA4 Realtime potwierdzono odbiór tool_opened, file_selected, import_completed, feature_used i export_created. Tag Assistant potwierdził tag G-R39FXG3NW8. Sesję diagnostyczną zakończono.

Nowy raport szczegółowy może początkowo pokazywać zero, mimo obecności zdarzeń w Realtime: dane wymagają przetworzenia przez GA4. Wybierz zakres obejmujący 10.10.2026 lub późniejsze dni. Dzisiejsze dane obejmują również testy wdrożeniowe.

## Import and template changes — 2026-10-18

- Import now detects UTF-16 byte-order marks automatically, with strict UTF-8 as the default otherwise. Legacy encodings remain an explicit choice with preview; bytes are never silently replaced.
- Duplicate/empty headers have a collision-safe rename suggestion. Data preview waits for a valid header. Short records can be padded at the end in batches of up to 100 displayed issues, after explicit confirmation; unresolved extra fields and quote errors still block import.
- `record_corrected` counts correction actions, including one batch action, not the number of records changed.
- Templates now preview before applying. Email, HTTP(S) URL, formatted-phone and year-first date repairs inspect individual cells instead of requiring 60% of a column to match. Dates with ambiguous day/month order and timestamps are preserved. Phone-like identifiers require user review in the preview.
- `feature_used` / `template` records actual Apply actions. Zero-change previews cannot be applied and do not emit `feature_used`; compare this metric with pre-release data accordingly.
- Validation: 29 automated tests, TypeScript check and production build; Chrome import → batch correction → email template preview/apply → undo/redo → downloaded CSV checked on disk. Also verified Windows-1252 recovery, duplicate/empty header repair and UTF-16 Polish text through the UI.

## Import and template diagnostics — 2026-10-25

- File reading and decoding now happen inside a persistent import worker. The preview transfers at most eight valid records per file; full tables stay in the worker until acceptance. Parsing emits progress every 10,000 records and completion. Cancellation terminates the worker without replacing editor data.
- Delimiter/header changes and retrying parsing retain preview corrections. Encoding changes reload originals. A stopped worker cannot preserve in-memory corrections; the UI explains this and retains selected import settings.
- `import_error` adds allowlisted `error_reason`: file_read, decode, empty_file, record_structure, resource_limit, parse_exception, worker_failed, transfer_failed. Worker failure does not establish an out-of-memory cause. Existing error_category remains for comparison. Reasons are deduplicated per import dialog.
- `template_previewed` emits template_id and outcome (success means changes found; no_changes means none found). It is NOT an applied repair. `feature_used` with feature=template includes template_id on actual application. All eight IDs are hard-coded; no CSV contents or user-defined names are sent.
- Registered event-scoped GA4 dimensions: CSV szablon (`template_id`) and CSV przyczyna błędu (`error_reason`). These apply prospectively after processing; no historical backfill. Updated the existing CSV usage report filter to include template_previewed.
- After import, suggested repairs inspect the first 500 rows only, explicitly labeled as a sample. No repairs apply automatically. Previewing a template still checks the entire table before explicit Apply.
- Validation: automated worker tests cover bounded preview/full commit, progress, correction retention/reset, read/decode/empty-file errors, legacy retry, merge and refusal of unresolved records. Analytics tests reject arbitrary template IDs/reasons and file names. Chrome: short-row repair, delimiter change retaining correction, import, email preview/apply and exported CSV checked on disk; synthetic 100 MiB (102,400 rows) and 300 MiB (307,200 rows) imported into editor; cancel during another large import preserves editor data. Synthetic files use two columns and 1 KiB payloads; results do not establish a universal file-size limit.
