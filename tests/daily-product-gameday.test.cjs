const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const DP={};vm.runInNewContext(fs.readFileSync('playbook/assets/daily-product-gameday.js','utf8'),{window:{DTPlaybook:DP},Date,Intl});
const data=JSON.parse(fs.readFileSync('playbook/data/current_season_public.json','utf8'));
const now=new Date('2026-10-13T15:00:00Z');
assert.equal(DP.nextSeasonGame(data,now).game_id,'0022600003');
assert.equal(DP.nextSeasonGame({...data,season_label:'2025-26'},now),null);
assert.equal(DP.nextSeasonGame({...data,games:[{...data.games[0],tipoff_utc:'2026-05-01T01:00:00Z'}]},now),null);
assert.equal(DP.nextSeasonGame({...data,games:[{...data.games[0],tipoff_utc:'invalid'}]},now),null);
console.log('4 schedule scenarios passed');
