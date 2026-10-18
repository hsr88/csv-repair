const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const valueSource = fs.readFileSync('client/src/lib/csv-template-values.ts', 'utf8').replace('export function', 'function');
const page = fs.readFileSync('client/src/pages/csv-repair.tsx', 'utf8');
const definitions = page.slice(page.indexOf('interface RepairTemplate'), page.indexOf('function RepairTemplatesTab'));
const source = valueSource + '\nconst Type=0,Trash2=0,Columns=0,Calendar=0,Mail=0,Phone=0,Zap=0,Link2=0;\n' + definitions + '\nmodule.exports = REPAIR_TEMPLATES;';
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
new Function('module', compiled)(loaded);
const apply = (id, values) => loaded.exports.find(t => t.id === id).apply(values.map(value => ({ value })), ['value']);

test('mixed text columns still repair individual emails, URLs, phones and dates', () => {
  for (const [id, from, to] of [
    ['lowercase-emails', ' A@EXAMPLE.COM ', 'a@example.com'],
    ['trim-urls', ' https://example.com/ ', 'https://example.com'],
    ['normalize-phones', ' +48 (123) 456-789 ', '+48123456789'],
    ['standardize-dates', '2026/1/2', '2026-01-02'],
  ]) {
    const values = ['unknown', 'N/A', from, 'pending', 'unknown'];
    const result = apply(id, values);
    assert.equal(result.changes, 1, id);
    assert.equal(result.data[2].value, to);
    assert.equal(result.data[0].value, 'unknown');
    assert.equal(apply(id, result.data.map(row => row.value)).changes, 0);
  }
});

test('dates preserve ambiguous, invalid and timestamp values without timezone shifts', () => {
  const values = ['01/02/2026', '2026-02-30', '2026-01-02T23:30:00-08:00', '2026-01-02'];
  assert.equal(apply('standardize-dates', values).changes, 0);
  assert.equal(apply('standardize-dates', ['2024/2/29']).data[0].value, '2024-02-29');
});

test('phones do not erase text, numeric IDs or ISO dates', () => {
  assert.equal(apply('normalize-phones', ['2026-10-18', '00123456789', 'call me', '+48 123 ext 9']).changes, 0);
});

test('all general templates count real changes without mutating the source', () => {
  for (const [id, values, changes] of [
    ['trim-whitespace', [' x ', 'y'], 1],
    ['remove-empty-rows', [' ', 'x', ''], 2],
    ['remove-duplicate-rows', ['x', 'x', 'y'], 1],
    ['fix-encoding', ['cafÃ©', 'correct'], 1],
  ]) {
    const original = values.map(value => ({ value }));
    const before = JSON.stringify(original);
    const result = loaded.exports.find(t => t.id === id).apply(original, ['value']);
    assert.equal(result.changes, changes, id);
    assert.equal(JSON.stringify(original), before);
  }
});

test('duplicate removal does not confuse embedded NUL with column boundaries', () => {
  const result = loaded.exports.find(t => t.id === 'remove-duplicate-rows').apply([{ a: 'x\0y', b: 'z' }, { a: 'x', b: 'y\0z' }], ['a', 'b']);
  assert.equal(result.changes, 0);
});
