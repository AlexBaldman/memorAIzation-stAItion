/** Immutable, reviewable practice event and correct SM-2 scheduling. */
export function scheduleSm2(previous={repetitions:0,interval:0,easiness:2.5},grade,now=new Date()) {
  if(!Number.isInteger(grade)||grade<0||grade>5)throw new RangeError('Grade must be an integer 0..5');
  const repetitions=grade<3?0:previous.repetitions+1;
  const easiness=Math.max(1.3,previous.easiness+0.1-(5-grade)*(0.08+(5-grade)*0.02));
  const interval=grade<3?1:repetitions===1?1:repetitions===2?6:Math.max(1,Math.ceil(previous.interval*easiness));
  const dueDate=new Date(now.getTime()+interval*86400000).toISOString();
  return {repetitions,interval,easiness,dueDate};
}
export function recordAttempt({slot,binding,grade,response='',startedAt,now=new Date(),id=()=>globalThis.crypto.randomUUID(),sessionId}) {
  if(!slot?.number||!binding?.id||!sessionId) throw new Error('Slot, binding and session are required');
  const occurredAt=now.toISOString();
  const durationMs=Math.max(0,now.getTime()-new Date(startedAt).getTime());
  return {id:id(),slotId:slot.number,bindingId:binding.id,sessionId,grade,response:String(response),durationMs,occurredAt};
}
export function deriveSchedules(events,now=new Date()) {
  const byBinding={};
  for(const event of [...events].sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt))) {
    byBinding[event.bindingId]=scheduleSm2(byBinding[event.bindingId],event.grade,new Date(event.occurredAt));
  }
  return byBinding;
}
export function isDue(schedule,now=new Date()) {return !schedule || schedule.dueDate<=now.toISOString();}