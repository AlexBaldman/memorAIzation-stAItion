import {test} from 'node:test';
import assert from 'node:assert/strict';
const store=new Map();
globalThis.window={};
globalThis.localStorage={getItem:key=>store.has(key)?store.get(key):null,setItem:(key,val)=>store.set(key,String(val)),removeItem:key=>store.delete(key)};
globalThis.requestAnimationFrame=()=>0;
const {MemoryState}=await import('../src/core/state.js');
const {sm2}=await import('../src/core/spaced-repetition.js');
test('memory state accepts nested review metadata without silent refusal',()=>{
 const state=new MemoryState();
 assert.equal(state.set('pao.data',{'42':{number:'42'}}),true);
 assert.equal(state.set('pao.data.42.sr',{interval:1,repetitions:1}),true);
 assert.equal(state.get('pao.data.42.sr.interval'),1);
 assert.equal(state.set('pao.data.42.__proto__.polluted',42),false);
 assert.equal({}.polluted,undefined);
 state.destroy();
});
test('new persistence key reloads while old theme key remains compatible',()=>{
 store.clear();const state=new MemoryState();
 state.set('ui.theme','ice');
 assert.equal(store.get('state_ui_theme'),'"ice"');
 const again=new MemoryState();assert.equal(again.get('ui.theme'),'ice');
 state.destroy();again.destroy();store.clear();
 store.set('theme','phosphor');const legacy=new MemoryState();
 assert.equal(legacy.get('ui.theme'),'phosphor');legacy.destroy();
});
test('SM-2 lapse returns to one day, not a multiplied long interval',()=>{
 const after=sm2(1,4,2.5,16);
 assert.equal(after.repetitions,0);
 assert.equal(after.interval,1);
 assert.ok(after.easiness>=1.3);
});