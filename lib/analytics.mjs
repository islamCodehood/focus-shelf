export function localDay(iso,timeZone='Africa/Cairo') {return new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));}
export function addDays(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function weekStartFor(day){return addDays(day,-new Date(day+'T12:00:00Z').getUTCDay());}
export function weekSummary(events,weekStart,timeZone='Africa/Cairo'){
 const end=addDays(weekStart,7),days=Array.from({length:7},(_,i)=>addDays(weekStart,i));
 const inWeek=events.filter(e=>{const d=localDay(e.at,timeZone);return d>=weekStart&&d<end;});
 const progress=inWeek.filter(e=>e.kind==='progress');
 const active=new Set(progress.filter(e=>e.delta>0).map(e=>localDay(e.at,timeZone)));
 const advanced=new Set(progress.filter(e=>e.delta>0).map(e=>e.itemId));
 const completed=new Set(inWeek.filter(e=>e.kind==='state'&&e.toState==='Done'&&e.fromState!=='Done').map(e=>e.itemId));
 const groups=new Map();
 for(const e of progress){const key=e.itemId+'|'+e.unit;const g=groups.get(key)||{id:key,title:e.payload.title,unit:e.unit,delta:0};g.delta+=e.delta;groups.set(key,g);}
 return {activeDays:active.size,advanced:advanced.size,completed:completed.size,days:days.map(day=>({day,active:active.has(day)})),progress:[...groups.values()]};
}
