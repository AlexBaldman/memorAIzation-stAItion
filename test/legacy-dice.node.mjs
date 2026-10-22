import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM(`<!doctype html><section id="view-dice-practice">
 <div id="dice-container"></div><button id="roll-btn"></button>
 <div id="roll-result"></div><button id="history-btn"></button>
 <div id="session-modal" class="hidden"><ul id="session-list"></ul><button id="close-modal"></button></div>
 </section>`,{url:'https://example.test'});
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;
globalThis.requestAnimationFrame=()=>0;
const [{initDicePracticeComponent},{memoryState}]=await Promise.all([
 import('../src/components/dice-practice.js'),import('../src/core/state.js')
]);
test('old app real DOM IDs activate the shared RollKit dice',()=>{
 memoryState.set('dice.session',[]);
 initDicePracticeComponent();
 assert.equal(document.querySelectorAll('#dice-container .die').length,2);
 let published=null;document.addEventListener('rollkit:result',event=>{published=event.detail},{once:true});
 document.getElementById('roll-btn').click();
 const events=memoryState.get('dice.session');
 assert.equal(events.length,1);
 assert.ok(events[0].twoDigit>=0&&events[0].twoDigit<=99);
 assert.equal(String(events[0].twoDigit).padStart(2,'0'),published.display);
 assert.equal(published.kind,'percentile-d10');
 assert.equal(document.getElementById('roll-result').textContent,`PAO Number: ${published.display}`);
 document.getElementById('history-btn').click();
 assert.equal(document.getElementById('session-list').children.length,1);
});