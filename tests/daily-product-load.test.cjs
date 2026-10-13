const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('playbook/assets/daily-product-load.js', 'utf8');
const day = date => ({schema_version:'playbook_day_public.v1',date,status:'ready',modules:{article:{article_title:'Test'}}});
const entry = date => ({date,status:'ready',file:`playbook_days/${date}.json`});
async function run(responses, cache = null) {
  let saved = cache;
  const DP = {state:{},root:{},dateLabel:x=>x,render(){this.rendered = true;}};
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-13T15:00:00Z'])); } }
  const context = {window:{DTPlaybook:DP},document:{currentScript:{src:'https://example.com/playbook/assets/daily-product-load.js'}},
    location:{href:'https://example.com/playbook/daily/'},URL,Date:FixedDate,Intl,Promise,
    localStorage:{getItem:()=>saved,setItem:(_,v)=>saved=v},
    fetch:async url => {const key=new URL(url).pathname.split('/data/')[1];if(!responses[key])throw Error('offline'); return {ok:true,json:async()=>responses[key]};}};
  vm.runInNewContext(code, context);
  await new Promise(resolve=>setImmediate(resolve));
  return {DP,cache:saved};
}
(async()=>{
 const manifest={days:[entry('2026-10-12'),entry('2026-10-13'),entry('2026-10-14')]};
 let r=await run({'playbook_manifest.json':manifest,'playbook_days/2026-10-12.json':day('2026-10-12'),'playbook_days/2026-10-13.json':day('2026-10-13'),'playbook_days/2026-10-14.json':day('2026-10-14')});
 assert.equal(r.DP.state.days.length,2);assert.equal(r.DP.state.days[r.DP.state.active].date,'2026-10-13');
 assert.equal(r.DP.todayChicago(new Date('2026-10-14T03:00:00Z')),'2026-10-13');
 let offline=await run({},r.cache);assert.equal(offline.DP.state.days.length,2);assert.match(offline.DP.state.notice,/latest available/);
 let partial=await run({'playbook_manifest.json':manifest,'playbook_days/2026-10-12.json':day('2026-10-12')});assert.equal(partial.DP.state.days.length,1);
 let recovered=await run({'playbook_manifest.json':manifest,'playbook_days/2026-10-12.json':day('2026-10-12')},r.cache);assert.equal(recovered.DP.state.days.length,2);
 let wrong=await run({'playbook_manifest.json':{days:[entry('2026-10-13')]},'playbook_days/2026-10-13.json':day('2026-10-12')});assert.equal(wrong.DP.rendered,undefined);
 let traversal=await run({'playbook_manifest.json':{days:[{...entry('2026-10-13'),file:'../private.json'}]}});assert.equal(traversal.DP.rendered,undefined);
 let future=await run({'playbook_manifest.json':{days:[entry('2026-10-14')]}});assert.match(future.DP.root.textContent,/being prepared/);
 console.log('7 loader scenarios passed');
})().catch(e=>{console.error(e);process.exit(1)});
