import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { applyRecipe, readRecipes, type CsvTable, type RepairRecipe, type RepairStep } from "@/lib/csv-workflows";

const STORAGE_KEY = "csv-repair-recipes-v1";
const fieldClass = "rounded-md border border-input bg-background px-3 py-2 text-sm";
const labels: Record<RepairStep["kind"], string> = { trim: "Trim whitespace", "remove-empty": "Remove empty rows", deduplicate: "Remove duplicates (keep first)", lowercase: "Lowercase a column" };

export function CsvRepairSets({ table, onApply }: { table: CsvTable; onApply: (result: CsvTable, name: string) => void }) {
  const [recipes, setRecipes] = useState<RepairRecipe[]>([]);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<RepairStep[]>([{ kind: "trim" }, { kind: "remove-empty" }]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<{ source: CsvTable; result: CsvTable }>();
  useEffect(() => { try { setRecipes(readRecipes(localStorage.getItem(STORAGE_KEY))); } catch { setError("Saved repair sets could not be read. Browser storage may be unavailable or contain invalid data."); } }, []);
  const updateSteps = (next: RepairStep[]) => { setSteps(next); setPreview(undefined); setStatus(""); };
  const save = (next: RepairRecipe[]) => {
    try { const validated = readRecipes(JSON.stringify(next)); localStorage.setItem(STORAGE_KEY, JSON.stringify(validated)); setRecipes(validated); setError(""); return true; }
    catch { setError("Could not save repair sets. Check browser storage or reduce the number of saved sets (maximum 100)."); return false; }
  };
  const validPreview = preview?.source === table ? preview : undefined;
  return <div className="h-full overflow-auto p-4 space-y-5">
    <div className="space-y-2"><h2 className="text-lg font-semibold">Saved repair sets</h2><p className="max-w-2xl text-sm text-muted-foreground">Run ordered cleanup steps on recurring exports. Only the name and rules are saved in this browser, never your CSV data. Preview first; applying a set creates one undo step.</p></div>
    {recipes.length > 0 && <div className="space-y-2"><h3 className="text-sm font-semibold">Saved in this browser</h3>{recipes.map(recipe => <div key={recipe.id} className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => { setName(recipe.name); updateSteps(recipe.steps.map(s => ({ ...s }))); setError(""); }}>{recipe.name}</Button>
      <Button variant="ghost" size="sm" aria-label={`Delete repair set ${recipe.name}`} onClick={() => save(recipes.filter(r => r.id !== recipe.id))}>Delete</Button>
    </div>)}</div>}
    <label className="block max-w-sm space-y-1 text-sm">Repair set name<input className={`${fieldClass} w-full`} value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="Monthly contacts cleanup" /></label>
    <ol className="space-y-3">{steps.map((step, i) => <li key={i} className="flex flex-wrap items-center gap-2 rounded-md border p-3">
      <span className="text-sm text-muted-foreground">{i + 1}.</span>
      <select aria-label={`Step ${i + 1} action`} className={`${fieldClass} max-w-full`} value={step.kind} onChange={e => updateSteps(steps.map((s, j) => j === i ? { kind: e.target.value as RepairStep["kind"], ...(e.target.value === "lowercase" ? { column: table.headers[0] } : {}) } : s))}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      {step.kind !== "remove-empty" && <select aria-label={`Step ${i + 1} column`} className={`${fieldClass} max-w-full`} value={step.column ?? ""} onChange={e => updateSteps(steps.map((s, j) => j === i ? { ...s, column: e.target.value || undefined } : s))}>
        {step.kind !== "lowercase" && <option value="">All columns</option>}
        {step.column && !table.headers.includes(step.column) && <option value={step.column}>{step.column} (missing)</option>}
        {table.headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>}
      <Button variant="ghost" size="sm" disabled={i === 0} aria-label={`Move step ${i + 1} up`} onClick={() => { const next = [...steps]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; updateSteps(next); }}>Move up</Button>
      <Button variant="ghost" size="sm" disabled={steps.length === 1} aria-label={`Remove step ${i + 1}`} onClick={() => updateSteps(steps.filter((_, j) => j !== i))}>Remove</Button>
    </li>)}</ol>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={steps.length >= 30} onClick={() => updateSteps([...steps, { kind: "trim" }])}>Add step</Button>
      <Button variant="outline" disabled={!name.trim()} onClick={() => {
        const recipe: RepairRecipe = { id: crypto.randomUUID(), name: name.trim(), steps };
        if (save([...recipes.filter(r => r.name !== recipe.name), recipe])) setStatus("Repair set saved. A set with the same name is replaced.");
      }}>Save repair set</Button>
      <Button onClick={() => { try { setPreview({ source: table, result: applyRecipe(table, steps) }); setError(""); setStatus(""); } catch (e) { setPreview(undefined); setError((e as Error).message); } }}>Preview changes</Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {status && <p role="status" className="text-sm">{status}</p>}
    {validPreview && <section className="space-y-3 rounded-md border p-3">
      <h3 className="text-sm font-semibold">Preview: {table.data.length} rows before → {validPreview.result.data.length} rows after</h3>
      <p className="text-xs text-muted-foreground">First 8 rows of each version. Steps run in the listed order. Duplicates keep the first matching row.</p>
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">{[{ label: "Before", value: table }, { label: "After", value: validPreview.result }].map(({ label, value }) => <div key={label} className="min-w-0"><h4 className="mb-2 text-sm font-medium">{label}</h4><div className="max-h-64 overflow-auto"><table className="w-full text-xs"><thead><tr>{value.headers.map(h => <th key={h} className="border bg-muted px-2 py-1 text-left">{h}</th>)}</tr></thead><tbody>{value.data.slice(0, 8).map((row, i) => <tr key={i}>{value.headers.map(h => <td key={h} className="whitespace-pre-wrap border px-2 py-1">{row[h]}</td>)}</tr>)}</tbody></table></div></div>)}</div>
      <Button onClick={() => { onApply(validPreview.result, name.trim() || "Custom repair set"); setPreview(undefined); setStatus("Repair set applied. Use Undo to restore the previous data."); }}>Apply repair set</Button>
    </section>}
  </div>;
}
