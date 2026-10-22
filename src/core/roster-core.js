/** Memorization domain logic. Import proposals and never overwrite historical bindings. */
export const FIRST_HUNDRED = Object.freeze(Array.from({length:100},(_,i)=>String(i).padStart(2,'0')));
const FIELDS = Object.freeze(['initials','person','action','object']);
const clean = value => String(value ?? '').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').trim().replace(/\s+/g,' ');
const comparable = value => clean(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
export function normalizeSnapshot(input, sourceId) {
  if (!sourceId || !/^[\w.:-]+$/.test(sourceId)) throw new Error('A stable source identifier is required');
  const records = Array.isArray(input) ? input : Object.entries(input ?? {}).map(([number,v])=>({number,...v}));
  const seen = new Set();
  return records.map(item => {
    const number = String(item.number ?? item.Number ?? item['#'] ?? '').padStart(2,'0');
    if (!FIRST_HUNDRED.includes(number)) throw new Error(`Invalid mnemonic slot ${number}`);
    if (seen.has(number)) throw new Error(`Duplicate mnemonic slot ${number} in ${sourceId}`);
    seen.add(number);
    return Object.freeze({
      id: `${sourceId}:${number}`, sourceId, number,
      initials: clean(item.initials ?? item.Initials),
      person: clean(item.person ?? item.name ?? item.Name ?? item.Person),
      action: clean(item.action ?? item.Action),
      object: clean(item.object ?? item.item ?? item.Item),
      status: 'candidate',
    });
  }).sort((a,b)=>a.number.localeCompare(b.number));
}
export function buildRegistry(...sourceGroups) {
  const byNumber = new Map(FIRST_HUNDRED.map(n=>[n, {number:n, bindings:[]}]));
  for (const group of sourceGroups) for (const binding of group) {
    const slot = byNumber.get(binding.number);
    if (!slot) throw new Error(`Unknown slot ${binding.number}`);
    const index = slot.bindings.findIndex(b=>b.id===binding.id);
    if(index<0) slot.bindings.push(binding);
    else if(JSON.stringify(slot.bindings[index])!==JSON.stringify(binding)) throw new Error(`Snapshot ${binding.id} was modified; create a new source ID`);
  }
  return [...byNumber.values()];
}
export function compareBindings(a,b) {
  if (!a || !b) return {fields:FIELDS,kind:'missing'};
  const fields=FIELDS.filter(field=>comparable(a[field])!==comparable(b[field]));
  return {fields, kind:fields.length===0?'identical-or-cosmetic':'review-required'};
}
export function resolveActive(slot, choices={}, preferredSource='legacy-public-app') {
  const selectedId=choices[slot.number];
  const selected=slot.bindings.find(b=>b.id===selectedId);
  return selected ?? slot.bindings.find(b=>b.sourceId===preferredSource) ?? slot.bindings[0] ?? null;
}
/** Choosing an active binding is distinct from promoting it to public canon. */
export function selectBinding(slot, bindingId, previous={}) {
  if (!slot.bindings.some(b=>b.id===bindingId)) throw new Error(`No binding ${bindingId} in slot ${slot.number}`);
  return {...previous,[slot.number]:bindingId};
}
export function tallyConflicts(registry) {
  let person=0,initials=0,action=0,object=0;
  for (const slot of registry) if(slot.bindings.length>=2) {
    const [first,...rest]=slot.bindings;
    const fields=new Set(rest.flatMap(x=>compareBindings(first,x).fields));
    if(fields.has('person'))person++;
    if(fields.has('initials'))initials++;
    if(fields.has('action'))action++;
    if(fields.has('object'))object++;
  }
  return {person,initials,action,object};
}
export function validate100(registry) {
  return registry.length===100 && registry.every((slot,i)=>slot.number===FIRST_HUNDRED[i] && slot.bindings.length>0);
}