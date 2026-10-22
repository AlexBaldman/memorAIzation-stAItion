import {test} from 'node:test';
import assert from 'node:assert/strict';
import {secureDigit,formatPercentile,rollPercentile,enterPhysicalRoll} from '../src/core/rollkit.js';
import {FIRST_HUNDRED,normalizeSnapshot,buildRegistry,compareBindings,selectBinding,resolveActive,tallyConflicts,validate100} from '../src/core/roster-core.js';
import {scheduleSm2,recordAttempt,deriveSchedules,isDue} from '../src/core/review-core.js';
const clock=()=>new Date('2026-10-22T12:00:00Z');
const id=()=> 'test-id';
test('all 100 slots and their leading zeros are stable',()=>{
 assert.equal(FIRST_HUNDRED.length,100);assert.equal(FIRST_HUNDRED[0],'00');assert.equal(FIRST_HUNDRED.at(-1),'99');
 for(let i=0;i<10;i++)for(let j=0;j<10;j++)assert.equal(formatPercentile(i,j),String(i*10+j).padStart(2,'0'));
 assert.throws(()=>formatPercentile(10,0),RangeError);
});
test('rejection sampling discards 2**32-1 and preserves zero',()=>{
 let seq=[4294967295,0,9];const rng={getRandomValues(b){b[0]=seq.shift();return b;}};
 assert.equal(secureDigit(rng),0);assert.equal(secureDigit(rng),9);assert.throws(()=>secureDigit(null));
});
test('digital and physical roll contracts never lose 00',()=>{
 const rng={getRandomValues(b){b[0]=0;return b;}};
 assert.deepEqual([rollPercentile({rng,clock,id}).display,enterPhysicalRoll(0,0,{clock,id}).display],['00','00']);
 assert.equal(rollPercentile({rng,clock,id}).source,'digital');
 assert.equal(enterPhysicalRoll(0,0,{clock,id}).source,'physical-entry');
});
test('snapshots import without mutation or accidental promotion',()=>{
 const old=normalizeSnapshot({'42':{name:'David Bowie',initials:'DB',action:'singing',object:'microphone'}},'old');
 const newer=normalizeSnapshot([{Number:'42',Name:'Derren Brown',Initials:'DB',Action:'Hypnotizing',Item:'Chair'}],'new');
 const slots=buildRegistry(old,newer); assert.equal(slots.length,100);
 const slot=slots[42];assert.equal(slot.bindings.length,2);
 assert.deepEqual(compareBindings(old[0],newer[0]).fields,['person','action','object']);
 assert.equal(tallyConflicts(slots).person,1);
 const choices=selectBinding(slot,newer[0].id);assert.equal(resolveActive(slot,choices).person,'Derren Brown');
 assert.equal(resolveActive(slot).person,'David Bowie');
 assert.throws(()=>selectBinding(slot,'nonexistent'));
 assert.throws(()=>normalizeSnapshot([{'Number':'01'},{'Number':'01'}],'x'),/Duplicate/);
});
test('full imported deck is valid',()=>{
 const data=Object.fromEntries(FIRST_HUNDRED.map(n=>[n,{name:`Person ${n}`} ]));
 assert.equal(validate100(buildRegistry(normalizeSnapshot(data,'seed'))),true);
});
test('review starts at one day, advances to six days and lapses back to one',()=>{
 const t=clock();let s=scheduleSm2(undefined,5,t);assert.equal(s.interval,1);
 s=scheduleSm2(s,5,t);assert.equal(s.interval,6);
 s=scheduleSm2(s,1,t);assert.equal(s.interval,1);assert.equal(s.repetitions,0);
 assert.throws(()=>scheduleSm2(undefined,8,t));
});
test('events preserve binding identity and reconstruct schedule',()=>{
 const event=recordAttempt({slot:{number:'42'},binding:{id:'source:42'},grade:5,response:'Derren Brown',startedAt:'2026-10-22T11:59:57Z',now:clock(),id,sessionId:'s1'});
 assert.equal(event.durationMs,3000);assert.equal(event.bindingId,'source:42');
 const result=deriveSchedules([event]);assert.equal(result['source:42'].interval,1);
 assert.equal(isDue(result['source:42'],clock()),false);
});