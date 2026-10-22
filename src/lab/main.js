/** MEMORY//LAB: standalone proving ground, living inside memorAIzation-stAItion. */
import legacyData from '../../data/memory-people.json';
import {rollPercentile, secureDigit} from '../core/rollkit.js';
import {normalizeSnapshot,buildRegistry,resolveActive,selectBinding,compareBindings,tallyConflicts} from '../core/roster-core.js';
import {recordAttempt,deriveSchedules,isDue} from '../core/review-core.js';
import {mountDiceThree} from './dice-three.js';
const $ = id => document.getElementById(id);
const KEY='memory-lab-v1';
const BASE_SOURCE='legacy-public-app';
const base = normalizeSnapshot(legacyData,BASE_SOURCE);
const init = {sources:[],choices:{},events:[],skin:'neon'};
function load(){try {const saved=JSON.parse(localStorage.getItem(KEY)||'null'); if(!saved) return structuredClone(init);return {sources:Array.isArray(saved.sources)?saved.sources:[],choices:saved.choices&&typeof saved.choices==='object'?saved.choices:{},events:Array.isArray(saved.events)?saved.events:[],skin:['neon','ice','ember','phosphor'].includes(saved.skin)?saved.skin:'neon'};}catch{return structuredClone(init);}}
let state=load();let registry=[];let selectedSlot=null;let selection=null;let startedAt=new Date();let revealed=false;let graded=false;let dice3d=null;let lastRoll=null;
function say(message){$('status').textContent=message;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){say(`Local save failed: ${e.message}. Export your data.`);}}
function rebuild(){registry=buildRegistry(base,...state.sources.map(s=>normalizeSnapshot(s.records,s.id)));renderDashboard();renderRoster();}
const createDiv=(cls,text='')=>{const n=document.createElement('div');n.className=cls;n.textContent=text;return n;};
function resolved(number){const slot=registry[Number(number)];return {slot,binding:resolveActive(slot,state.choices,BASE_SOURCE)};}
function startSlot(number,origin='selected'){
 if(!Number.isInteger(number)||number<0||number>99)throw new RangeError('Number must be 00–99');
 selectedSlot=registry[number];selection=resolveActive(selectedSlot,state.choices,BASE_SOURCE);
 startedAt=new Date();revealed=false;graded=false;$('answer').classList.add('hidden');$('grading').classList.add('hidden');$('reveal').disabled=false;
 $('response').value='';const digits=selectedSlot.number;$('result').replaceChildren(document.createTextNode(digits[0]));const last=document.createElement('span');last.textContent=digits[1];$('result').appendChild(last);
 $('die-tens').querySelector('span').textContent=digits[0];$('die-ones').querySelector('span').textContent=digits[1];
 $('result-source').textContent=`${origin.toUpperCase()} · slot ${digits} · answer hidden`;
 $('number').value=number;$('practice-msg').textContent='Recall the person, action and object before revealing.';
 if(dice3d) dice3d.setDigits(Number(digits[0]),Number(digits[1]));
}
function roll(){try{const event=rollPercentile();lastRoll=event;startSlot(event.value,'digital roll');
 document.dispatchEvent(new CustomEvent('rollkit:result',{detail:event}));
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){ for(const id of ['die-tens','die-ones']){$(id).classList.remove('rolling');void $(id).offsetWidth;$(id).classList.add('rolling');} }
 say(`Rolled ${event.display}. Recall the association!`);
}catch(e){say(`Dice error: ${e.message}`);}}
function showAnswer(){if(!selection){say('Import or select a roster entry first.');return;}
 revealed=true;$('answer').classList.remove('hidden');$('grading').classList.remove('hidden');$('reveal').disabled=true;
 $('person').textContent=selection.person||'Unassigned';$('action').replaceChildren();$('object').replaceChildren();$('source').replaceChildren();
 const action=document.createElement('strong');action.textContent='ACTION  ';
 $('action').append(action,document.createTextNode(selection.action||'not assigned'));
 const object=document.createElement('strong');object.textContent='OBJECT  ';
 $('object').append(object,document.createTextNode(selection.object||'not assigned'));
 $('source').textContent=`SOURCE: ${selection.sourceId} · active locally, not public canon`;
 $('practice-msg').textContent='Rate your recall, then roll again.';
}
function grade(n){if(!revealed||graded||!selection)return;
 try{const event=recordAttempt({slot:selectedSlot,binding:selection,grade:n,response:$('response').value,startedAt,sessionId:'local-memory-lab',now:new Date()});state.events.push(event);graded=true;save();renderDashboard();renderHistory();
 $('grading').classList.add('hidden');$('practice-msg').textContent=`Recorded grade ${n}/5 for ${selectedSlot.number}. Next review has been scheduled.`;say(`Saved! ${selectedSlot.number} is in your review history.`);
 }catch(e){say(`Review error: ${e.message}`);}}
function nextDue(){const schedules=deriveSchedules(state.events);const due=registry.filter(slot=>{const binding=resolveActive(slot,state.choices,BASE_SOURCE);return binding && isDue(schedules[binding.id]);});
 if(!due.length){say('All current bindings reviewed. Nicely done.');return;}
 // Fisher-Yates style rejection sampling over any 1..100-sized candidate pool.
 const limit=Math.floor(0x100000000/due.length)*due.length;const sample=new Uint32Array(1);do{crypto.getRandomValues(sample)}while(sample[0]>=limit);
 const slot=due[sample[0]%due.length];startSlot(Number(slot.number),'due review');say(`Due review: ${slot.number}`);
}
function renderDashboard(){const schedules=deriveSchedules(state.events);let due=0;for(const slot of registry){const b=resolveActive(slot,state.choices,BASE_SOURCE);if(b&&isDue(schedules[b.id]))due++;}
 $('stat-attempts').textContent=state.events.length;$('stat-due').textContent=due;
 $('stat-quality').textContent=state.events.length?(state.events.reduce((n,e)=>n+e.grade,0)/state.events.length).toFixed(1):'—';
 $('stat-sources').textContent=1+state.sources.length;$('stat-complete').textContent=registry.filter(slot=>resolveActive(slot,state.choices)?.person).length;$('stat-conflicts').textContent=tallyConflicts(registry).person;
}
function renderRoster(){const filter=$('reconcile-search').value.trim().toLowerCase();$('roster-results').replaceChildren();let displayed=0;
 for(const slot of registry){const active=resolveActive(slot,state.choices,BASE_SOURCE);const hay=[slot.number,...slot.bindings.map(b=>b.person)].join(' ').toLowerCase();if(filter&&!hay.includes(filter))continue;
 const relevant=slot.bindings.length>1&&slot.bindings.some(b=>compareBindings(slot.bindings[0],b).fields.length);
 if(!filter&&!relevant&&displayed>=10)continue;displayed++;
 const outer=createDiv('slot');const title=createDiv('headrow');title.append(createDiv('kicker',`#${slot.number} · ${slot.bindings.length} source${slot.bindings.length>1?'s':''}`));
 if(relevant)title.append(createDiv('badge','DIFF REVIEW'));outer.append(title);
 for(const binding of slot.bindings){const row=createDiv('');const p=document.createElement('p');p.textContent=`${binding.person||'Unassigned'} · ${binding.initials||'??'} · ${binding.sourceId}`;row.append(p);
 const small=document.createElement('p');small.textContent=`${binding.action||'—'} / ${binding.object||'—'}`;row.append(small);
 const button=document.createElement('button');button.textContent=active?.id===binding.id?'✓ Active locally':'Use this binding';button.disabled=active?.id===binding.id;
 button.addEventListener('click',()=>{state.choices=selectBinding(slot,binding.id,state.choices);save();renderRoster();renderDashboard();if(selectedSlot?.number===slot.number)startSlot(Number(slot.number),'roster selection');say(`Slot ${slot.number} set locally to ${binding.person}. No historical source was overwritten.`);});row.append(button);outer.append(row);}
 $('roster-results').append(outer);
 }
 if(!displayed)$('roster-results').append(createDiv('hint','No matching slots.'));
}
function renderHistory(){const root=$('history-results');root.replaceChildren();for(const event of [...state.events].reverse().slice(0,150)){
 const row=createDiv('slot');row.append(createDiv('kicker',`${event.slotId} · ${event.grade}/5 · ${(event.durationMs/1000).toFixed(1)}s`));
 row.append(createDiv('small muted',`${event.bindingId} · ${new Date(event.occurredAt).toLocaleString()}`));root.append(row);
 }if(!state.events.length)root.append(createDiv('hint','No attempts yet. Your future self is waiting for some evidence.'));
}
function exportFile(name,data,type='application/json'){const blob=new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportBackup(){exportFile('memory-lab-backup.json',JSON.stringify({kind:'memory-lab-v1',exportedAt:new Date().toISOString(),state},null,2));say('Exported local selections and practice history.');}
function exportCSV(){const cols=['id','slotId','bindingId','grade','response','durationMs','occurredAt'];const quoted=v=>{let s=String(v??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const csv=[cols.join(','),...state.events.map(event=>cols.map(k=>quoted(event[k])).join(','))].join('\r\n');exportFile('memory-lab-attempts.csv',csv,'text/csv');}
async function importFile(file){try{if(file.size>2_000_000)throw new Error('File exceeds 2 MB import limit');const incoming=JSON.parse(await file.text());
 if(incoming.kind==='memory-lab-v1'){
  const payload=incoming.state;if(!payload||!Array.isArray(payload.sources)||!Array.isArray(payload.events))throw new Error('Malformed backup');
  state={...structuredClone(init),...payload};rebuild();save();renderHistory();startSlot(42,'restored backup');say('Backup restored with review events, choices and roster sources.');return;
 }
 const payload=incoming.records??incoming;
 const sourceId=`local-import-${new Date().toISOString().replace(/[:.]/g,'-')}`;
 const records=normalizeSnapshot(payload,sourceId);
 if(!records.length)throw new Error('No valid mnemonic entries found');
 state.sources.push({id:sourceId,label:file.name,records:records.map(({number,initials,person,action,object})=>({number,initials,person,action,object}))});
 rebuild();save();say(`Imported ${records.length} entries from ${file.name}; originals preserved.`);
 }catch(e){say(`Import failed: ${e.message}`);}finally{$('file').value='';}}
function setTab(tab){for(const name of ['dashboard','rosters','history'])$('tab-'+name).classList.toggle('hidden',name!==tab);
 for(const b of document.querySelectorAll('[data-tab]')){b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',String(b.dataset.tab===tab));}}
async function toggle3D(){try{if(dice3d){dice3d.dispose();dice3d=null;$('toggle3d').textContent='3D Preview';$('die-tens').classList.remove('hidden');$('die-ones').classList.remove('hidden');return;}
 say('Loading optional 3D preview. 2D works entirely offline.');dice3d=await mountDiceThree($('dice-stage'),{skin:state.skin});$('die-tens').classList.add('hidden');$('die-ones').classList.add('hidden');if(selectedSlot)dice3d.setDigits(Number(selectedSlot.number[0]),Number(selectedSlot.number[1]));$('toggle3d').textContent='2D Fallback';say('Three.js d10 preview active (online module).');
 }catch(e){dice3d?.dispose();dice3d=null;say(`3D unavailable: ${e.message}. 2D fallback remains active.`);}}
for(let n=0;n<6;n++){const btn=document.createElement('button');btn.textContent=n;btn.setAttribute('aria-label',`Grade ${n} out of 5`);btn.addEventListener('click',()=>grade(n));$('grades').append(btn);}
$('roll').addEventListener('click',roll);$('due').addEventListener('click',nextDue);$('go').addEventListener('click',()=>{const n=Number($('number').value);if(Number.isInteger(n)&&n>=0&&n<=99)startSlot(n,'manual selection');else say('Enter an integer between 0 and 99.');});
$('reveal').addEventListener('click',showAnswer);$('skip').addEventListener('click',()=>startSlot(Number(selectedSlot?.number??'42'),'new attempt'));
$('file').addEventListener('change',e=>{const file=e.target.files[0];if(file)void importFile(file);});$('export').addEventListener('click',exportBackup);$('export-csv').addEventListener('click',exportCSV);
$('clear-history').addEventListener('click',()=>{if(confirm('Permanently clear local practice attempts? This cannot be undone unless you exported a backup.')){state.events=[];save();renderDashboard();renderHistory();say('Local practice history cleared.');}});
$('skin').value=state.skin;document.body.dataset.skin=state.skin;$('skin').addEventListener('change',e=>{state.skin=e.target.value;document.body.dataset.skin=state.skin;save();dice3d?.setSkin(state.skin);});$('toggle3d').addEventListener('click',()=>void toggle3D());$('reconcile-search').addEventListener('input',renderRoster);
for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>setTab(b.dataset.tab));
rebuild();renderHistory();startSlot(42,'demo starting slot');say('Ready. Public legacy roster loaded. Import your current private roster to reconcile.');