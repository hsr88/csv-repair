const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const compiled = ts.transpileModule(fs.readFileSync('client/src/lib/analytics.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
function setup(host = 'www.csv.repair', stored = {}, storageFails = false) {
  const memory = new Map(Object.entries(stored)); const scripts = []; const listeners = {}; const deleted = [];
  const window = {location: {hostname: host, origin: 'https://' + host, pathname: '/', search: '?secret=private'}, addEventListener: (n, f) => listeners[n] = f, dispatchEvent: () => {}};
  const document = {referrer: 'https://example.com/private?email=secret', createElement: () => ({}), head: {appendChild: s => scripts.push(s)}};
  Object.defineProperty(document, 'cookie', {get: () => '_ga=old; _ga_R39FXG3NW8=old; essential=keep', set: value => deleted.push(value)});
  const localStorage = {getItem: k => {if(storageFails) throw Error(); return memory.get(k) ?? null}, setItem: (k,v) => {if(storageFails) throw Error(); memory.set(k,v)}, removeItem: k => memory.delete(k)};
  const exports = {}; vm.runInNewContext(compiled, {exports, window, document, localStorage, Event: class {}, URL});
  const calls = () => (window.dataLayer || []).map(x => Array.from(x));
  return {a: exports, window, scripts, memory, calls, deleted, listeners};
}
test('no consent or legacy acceptance: no tag, no events, clear only GA cookies', () => {
  for(const stored of [{}, {'cookie-consent':'accepted'}]) {
    const e=setup(undefined,stored); e.a.initAnalytics(); e.a.track('file_selected'); e.a.trackPage();
    assert.equal(e.scripts.length,0); assert.equal(e.calls().length,0); assert.ok(e.window['ga-disable-G-R39FXG3NW8']);
    assert.ok(e.deleted.some(x=>x.startsWith('_ga='))); assert.ok(!e.deleted.some(x=>x.startsWith('essential=')));
  }
});
test('accept loads exactly once, sets ad consent denied, deduplicates pageview and editor event',()=>{
  const e=setup();e.a.initAnalytics();e.a.setConsent('accepted');e.a.initAnalytics();e.a.trackPage();e.a.setConsent('accepted');
  assert.equal(e.scripts.length,1);assert.equal(e.calls().filter(x=>x[1]==='page_view').length,1);assert.equal(e.calls().filter(x=>x[1]==='tool_opened').length,1);
  assert.equal(e.calls().find(x=>x[0]==='consent')[2].ad_user_data,'denied');
  assert.ok(!JSON.stringify(e.calls()).includes('secret'));assert.ok(!JSON.stringify(e.calls()).includes('/private'));
});
test('runtime allowlist strips names, SQL, arbitrary parameter values and event names',()=>{
 const e=setup();e.a.initAnalytics();e.a.setConsent('accepted');
 e.a.track('feature_used',{feature:'sql',outcome:'success',file_name:'secret.csv',query:'SELECT private',row_bucket:'secret'});
 const params=e.calls().at(-1)[2];assert.equal(params.feature,'sql');assert.ok(!('file_name' in params));assert.ok(!('query' in params));assert.ok(!('row_bucket' in params));
 const count=e.calls().length;e.a.track('secret',{});assert.equal(e.calls().length,count);
});
test('withdrawal blocks all product events immediately and stays declined on reload',()=>{
 const e=setup();e.a.initAnalytics();e.a.setConsent('accepted');e.a.setConsent('declined');const n=e.calls().length;
 e.a.track('export_created');e.a.trackPage();assert.equal(e.calls().length,n);assert.ok(e.window['ga-disable-G-R39FXG3NW8']);
 const reload=setup(undefined,Object.fromEntries(e.memory));reload.a.initAnalytics();assert.equal(reload.scripts.length,0);
 e.a.setConsent('accepted');assert.equal(e.scripts.length,1);assert.equal(e.window['ga-disable-G-R39FXG3NW8'],false);
});
test('consent withdrawal propagates from another tab',()=>{
 const e=setup();e.a.initAnalytics();e.a.setConsent('accepted');e.memory.set(e.a.CONSENT_KEY,'declined');e.listeners.storage({key:e.a.CONSENT_KEY});
 assert.equal(e.a.getConsent(),'declined');assert.ok(e.window['ga-disable-G-R39FXG3NW8']);
});
test('blocked local storage and localhost do not break the tool or pollute production',()=>{
 const e=setup('localhost',{},true);e.a.initAnalytics();e.a.setConsent('accepted');e.a.track('file_selected');assert.equal(e.scripts.length,0);assert.equal(e.a.getConsent(),'accepted');e.a.setConsent('declined');assert.equal(e.a.getConsent(),'declined');
});
test('safe size and row buckets at boundaries',()=>{
 const {a}=setup();assert.equal(a.fileMetrics([{size:1048576}]).size_bucket,'1_10mb');assert.equal(a.tableMetrics(100001,51).row_bucket,'100001_plus');assert.equal(a.tableMetrics(0,1).row_bucket,'0');assert.equal(a.durationMetrics(5000).duration_bucket,'5_30s');
});
test('tag failures never interrupt product operations',()=>{
 const e=setup();e.a.initAnalytics();e.a.setConsent('accepted');e.window.gtag=()=>{throw Error('blocked')};assert.doesNotThrow(()=>e.a.track('export_created'));
});
