# GA4: faktyczne użycie csv.repair

Wdrożenie: 10.10.2026. Usługa csvrepair (525806252), strumień csv (13660739913), G-R39FXG3NW8.

## Raport

Zapisany w GA4: CSV repair — faktyczne użycie narzędzia (16101612619).
Wiersze: nazwa wydarzenia. Metryki: całkowita liczba użytkowników, liczba zdarzeń, sesje.
Filtr obejmuje tylko osiem poniższych zdarzeń. Nie ma danych historycznych o tych działaniach.

| Zdarzenie | Kiedy |
| --- | --- |
| tool_opened | Otwarta główna strona edytora, po zgodzie |
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

Basic consent: przed zgodą nie ładujemy tagu Google ani nie kolejkujemy wcześniejszych działań. Stare cookie-consent nie jest zgodą na nowy zakres; pytamy ponownie. Cookie settings pozwala zmienić zdanie bez przeładowania i utraty CSV. Wycofanie ustawia ga-disable, odmawia analytics_storage i usuwa cookies _ga. Zmiana synchronizuje się między kartami. W razie niedostępności localStorage wybór działa w pamięci bieżącej karty.

Reklamowe zgody pozostają denied, Google Signals i personalizacja reklam wyłączone w kodzie. Automatyczny pomiar zaawansowany GA4 wyłączono za osobną zgodą właściciela, by nie zbierał nazw pobrań, tekstów/formularzy ani zdublowanych odsłon SPA.

Wysyłane są wyłącznie dozwolone kategorie. Nie wysyłamy nazw plików/kolumn, wartości komórek, SQL, wyszukiwań ani nazw zestawów. URL bez query/hash; referrer ograniczony do origin. Konsekwencją usunięcia query jest brak atrybucji UTM; podstawowy referrer pozostaje dostępny.

Parametry: feature, outcome, export_type, error_category, size_bucket (łączny rozmiar wybranych plików), row_bucket, column_bucket, file_count, duration_bucket. Czas importu/anulowania obejmuje pracę w podglądzie i decyzję użytkownika; SQL obejmuje wykonanie i załadowanie modułu. Są to przedziały, nie dokładne wartości.

Odmowy, blokery i zamknięcia kart powodują niepełny pomiar. import_cancelled nie próbuje niezawodnie mierzyć zamknięcia przeglądarki; porzucenie oceniaj także przez brak kolejnego etapu. Zmiana zgody w środku operacji może dać import bez file_selected. Lokalny development i preview nie wysyłają danych do produkcyjnego GA4. Raporty i definicje niestandardowe potrzebują czasu na przetworzenie nowych danych.

## Walidacja

npm run check; npm run build; npm test.
Testy analytics sprawdzają blokadę przed zgodą, powrót z zapisaną odmową, brak duplikatów, whitelist parametrów, wycofanie i synchronizację między kartami, niedostępność storage, przedziały i odporność na błąd tagu.
Test UI: odmowa → import 3 rekordów → zmiana zgody bez utraty danych → SQL → eksport → wycofanie zgody.
