const test = require('node:test');
const assert = require('node:assert/strict');
const {buildSync} = require('esbuild');
const code = buildSync({entryPoints:['client/src/lib/csv-import.worker.ts'],bundle:true,write:false,platform:'browser',format:'iife'}).outputFiles[0].text;
const options={delimiter:'',encoding:'auto',header:true};
function worker(){ const messages=[];const self={postMessage:m=>messages.push(structuredClone(m))};new Function('self',code)(self);return {messages,send:async data=>{messages.length=0;await self.onmessage({data});return messages.at(-1)}}; }
const file=text=>new Blob([text]);
test('worker preview is bounded, progress is emitted, accepted import retains every row',async()=>{
 const w=worker();const result=await w.send({type:'load',files:[file('id,value\n'+Array.from({length:10001},(_,i)=>i+',hello').join('\n'))],options});
 assert.equal(result.type,'preview');assert.equal(result.results[0].data.length,8);assert.ok(w.messages.some(m=>m.type==='progress'&&m.records>=10000));
 const done=await w.send({type:'commit'});assert.equal(done.table.data.length,10001);assert.equal(done.table.data.at(-1).id,'10000');
});
test('worker retains explicit corrections through reparsing and can reset originals',async()=>{
 const w=worker();let r=await w.send({type:'load',files:[file('a,b\n1\n2,3')],options});assert.equal(r.results[0].issueCount,1);
 r=await w.send({type:'pad',index:0});assert.equal(r.results[0].issueCount,0);assert.deepEqual(r.changed,[true]);
 r=await w.send({type:'parse',options});assert.equal(r.results[0].data[0].b,'');
 r=await w.send({type:'reset',index:0});assert.equal(r.results[0].issueCount,1);assert.deepEqual(r.changed,[false]);
});
test('worker distinguishes read, decode and empty-file failures, and supports legacy retry',async()=>{
 const w=worker();assert.equal((await w.send({type:'load',files:[{arrayBuffer:()=>Promise.reject(Error('private name'))}],options})).reason,'file_read');
 const bytes=new Blob([new Uint8Array([97,10,233])]);assert.equal((await w.send({type:'load',files:[bytes],options})).reason,'decode');
 const recovered=await w.send({type:'load',files:[bytes],options:{...options,encoding:'windows-1252'}});assert.equal(recovered.results[0].data[0].a,'é');
 assert.equal((await w.send({type:'load',files:[file('')],options})).reason,'empty_file');
});
test('worker merge aligns columns and refuses unresolved records',async()=>{
 const w=worker();await w.send({type:'load',files:[file('a,b\n1,2'),file('b,a\n3,4')],options});const done=await w.send({type:'commit'});assert.equal(done.merged,true);assert.deepEqual(done.table.data,[{a:'1',b:'2'},{a:'4',b:'3'}]);
 await w.send({type:'load',files:[file('a,b\n1')],options});assert.equal((await w.send({type:'commit'})).type,'error');
});

