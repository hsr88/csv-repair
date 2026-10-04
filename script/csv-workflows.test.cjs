const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('client/src/lib/csv-workflows.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const loaded = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, loaded, loaded.exports);
const { parseImport, defaultImportOptions: defaults, replaceRecord, mergeTables, splitRanges, serializeCsv, applyRecipe, readRecipes } = loaded.exports;
const parse = (text, options = {}) => parseImport(text, { ...defaults, ...options });

test('BOM, CRLF, delimiters, quotes and multiline values round-trip', () => {
  const text = '\uFEFFid;note\r\n1;"first\r\nsecond"\r\n2;"say ""hi""; yes"\r\n';
  const result = parse(text);
  assert.equal(result.issueCount, 0);
  assert.equal(result.delimiter, ';');
  assert.deepEqual(result.data, [{ id: '1', note: 'first\r\nsecond' }, { id: '2', note: 'say "hi"; yes' }]);
  assert.deepEqual(parse(serializeCsv(result, ';', true)).data, result.data);
});

test('headerless import preserves first record and quoted empty cells', () => {
  const result = parse('1,a\n2,b\n"",""\n', { header: false });
  assert.equal(result.data.length, 3);
  assert.deepEqual(result.headers, ['Column 1', 'Column 2']);
  assert.equal(result.data[0]['Column 1'], '1');
});

test('duplicate and blank headers are reported instead of overwriting values', () => {
  for (const source of ['id,id\n1,2', 'id,\n1,2']) assert.ok(parse(source).issueCount > 0);
  assert.throws(() => parse(' \r\n'), /no CSV records/);
});

test('short record suggestion preserves following records and BOM offsets', () => {
  const source = '\uFEFFid,name,note\r\n1,A\r\n2,B,ok\r\n';
  const result = parse(source, { delimiter: ',' });
  assert.equal(result.issueCount, 1);
  assert.equal(result.issues[0].raw, '1,A\r\n');
  const fixed = parse(replaceRecord(source, result.issues[0], result.issues[0].suggestion));
  assert.equal(fixed.issueCount, 0);
  assert.deepEqual(fixed.data, [{ id: '1', name: 'A', note: '' }, { id: '2', name: 'B', note: 'ok' }]);
});

test('extra fields require explicit correction, with no silently accepted bad rows', () => {
  const source = 'id,note\n1,hello, world\n2,ok';
  const result = parse(source, { delimiter: ',' });
  assert.equal(result.issueCount, 1);
  assert.equal(result.data.length, 1);
  const fixed = parse(replaceRecord(source, result.issues[0], '1,"hello, world"'));
  assert.equal(fixed.issueCount, 0);
  assert.equal(fixed.data[0].note, 'hello, world');
  assert.throws(() => replaceRecord(source, result.issues[0], ''), /cannot silently delete/);
});

test('unclosed quote can be corrected without losing subsequent records', () => {
  const source = 'id,note\n1,"broken\n2,ok';
  const result = parse(source, { delimiter: ',' });
  assert.equal(result.issueCount, 1);
  const fixed = parse(replaceRecord(source, result.issues[0], '1,"broken"\n2,ok'));
  assert.equal(fixed.issueCount, 0);
  assert.equal(fixed.data.length, 2);
});

test('merge aligns column names, keeps missing columns empty and handles prototype names', () => {
  const a = parse('id,name\n1,A');
  const b = parse('name,id,note\nB,2,"line1\nline2"');
  const c = parse('__proto__,constructor\nx,y');
  const merged = mergeTables([a, b, c]);
  assert.deepEqual(merged.headers, ['id', 'name', 'note', '__proto__', 'constructor']);
  assert.equal(merged.data[1].id, '2');
  assert.equal(merged.data[0].constructor, '');
  assert.equal(merged.data[2].__proto__, 'x');
  assert.deepEqual(parse(serializeCsv(merged)).data, merged.data);
});

test('split keeps multiline records intact and repeats headers without losing rows', () => {
  const original = parse('id,note\n1,"a\nb"\n2,"x,y"\n3,last');
  const ranges = splitRanges(original.data.length, 2);
  const parts = ranges.map(({ start, end }) => parse(serializeCsv({ headers: original.headers, data: original.data.slice(start, end) })));
  assert.deepEqual(parts.map(p => p.headers), [original.headers, original.headers]);
  assert.deepEqual(parts.flatMap(p => p.data), original.data);
  for (const invalid of [0, -1, 1.5, NaN]) assert.throws(() => splitRanges(3, invalid));
  assert.throws(() => splitRanges(1001, 1), /1,000/);
});

test('repair steps run in order, preserve source, and fail atomically on missing columns', () => {
  const table = parse('email,note\n" A@EXAMPLE.COM ",x\na@example.com,x\n" "," "');
  const before = JSON.stringify(table);
  const steps = [{ kind: 'trim' }, { kind: 'lowercase', column: 'email' }, { kind: 'remove-empty' }, { kind: 'deduplicate' }];
  const result = applyRecipe(table, steps);
  assert.deepEqual(result.data, [{ email: 'a@example.com', note: 'x' }]);
  assert.equal(JSON.stringify(table), before);
  assert.throws(() => applyRecipe(table, [...steps, { kind: 'trim', column: 'missing' }]), /missing/);
  assert.equal(JSON.stringify(table), before);
  assert.equal(applyRecipe(table, [{ kind: 'deduplicate' }, ...steps.slice(0, 3)]).data.length, 2);
});

test('recipe storage round-trips rules and rejects corrupt or unsupported data', () => {
  const recipes = [{ id: 'one', name: 'Contacts', steps: [{ kind: 'trim' }, { kind: 'lowercase', column: 'email' }] }];
  assert.deepEqual(readRecipes(JSON.stringify(recipes)), recipes);
  assert.deepEqual(readRecipes(null), []);
  for (const invalid of ['bad json', '{}', '[{"id":"x","name":"x","steps":[{"kind":"execute"}]}]']) assert.throws(() => readRecipes(invalid));
});

test('all structural issues are counted even when the displayed list is capped', () => {
  const result = parse('id,note\n' + Array.from({ length: 150 }, (_, i) => String(i)).join('\n'), { delimiter: ',' });
  assert.equal(result.issueCount, 150);
  assert.equal(result.issues.length, 100);
  assert.equal(result.data.length, 0);
});

test('100,001 records survive import and split boundaries', () => {
  const source = 'id,note\n' + Array.from({ length: 100001 }, (_, i) => `${i},record ${i}`).join('\n');
  const result = parse(source);
  assert.equal(result.issueCount, 0);
  assert.equal(result.data.length, 100001);
  assert.equal(result.data[100000].id, '100000');
  assert.deepEqual(splitRanges(result.data.length, 50000), [{ start: 0, end: 50000 }, { start: 50000, end: 100000 }, { start: 100000, end: 100001 }]);
});
