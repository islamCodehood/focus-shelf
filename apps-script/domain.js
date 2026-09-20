/* Pure domain rules. Also executed by Apps Script (V8). */
var ITEM_KEYS=['id','title','type','coverFileId','resourceUrl','state','unit','customUnit','current','total','why','doneDefinition','nextStep','queuePosition','addedAt','startedAt','updatedAt','finishedAt','version'];
var STATES=['Main','Side','Parking','Paused','Done','Dropped'];
function fail(code,message){var e=new Error(message);e.code=code;throw e;}
function textValue(v,max){if(v==null)return '';if(typeof v!=='string'||v.length>max)fail('VALIDATION','Text is too long or invalid.');return v.trim();}
function choice(v,list){if(list.indexOf(v)<0)fail('VALIDATION','Choose a valid option.');return v;}
function numberValue(v,min){if(typeof v!=='number'||!isFinite(v)||v<min||v>100000000)fail('VALIDATION','Enter a valid non-negative amount.');return Math.round(v*100)/100;}
function slotCheck(items,state,id){if((state==='Main'||state==='Side')&&items.some(function(i){return i.id!==id&&i.state===state;}))fail('SLOT_FULL',state+' is occupied. Pause, complete, or drop its current resource first.');}
function validateItem(item){
 item.title=textValue(item.title,240);if(!item.title)fail('VALIDATION','A title is required.');
 item.type=choice(item.type,['Book','Course','Article','Video','Other']);item.state=choice(item.state,STATES);
 item.unit=choice(item.unit,['Pages','Chapters','Lessons','Minutes','Hours','Percent','Custom']);
 item.customUnit=textValue(item.customUnit,30);if(item.unit==='Custom'&&!item.customUnit)fail('VALIDATION','Name your custom unit.');
 item.current=numberValue(item.current,0);item.total=item.total===null||item.total===''?null:numberValue(item.total,.01);
 if(item.unit==='Percent')item.total=100;
 if(item.total!==null&&item.current>item.total)fail('VALIDATION','Progress cannot exceed the total.');
 if(['Pages','Chapters','Lessons'].indexOf(item.unit)>=0&&(item.current%1||(item.total!==null&&item.total%1)))fail('VALIDATION','Use whole units for pages, chapters, and lessons.');
 item.coverFileId=textValue(item.coverFileId,160);if(item.coverFileId&&!/^[\w-]+$/.test(item.coverFileId))fail('VALIDATION','Invalid cover ID.');
 item.resourceUrl=textValue(item.resourceUrl,2048);if(item.resourceUrl&&!/^https?:\/\/[^\s]+$/i.test(item.resourceUrl))fail('VALIDATION','Use a valid http or https resource link.');
 item.why=textValue(item.why,2000);item.doneDefinition=textValue(item.doneDefinition,2000);item.nextStep=textValue(item.nextStep,1000);item.queuePosition=numberValue(item.queuePosition,0);return item;
}
function reduceEvents(events){var items={},reviews={};events.forEach(function(e){if(e.kind==='review')reviews[e.payload.weekStart]=e.payload;else if(e.itemId)items[e.itemId]=e.payload;});return {items:Object.keys(items).map(function(k){return items[k];}),reviews:Object.keys(reviews).map(function(k){return reviews[k];}),events:events,timeZone:'Africa/Cairo'};}
function makeEvent(snapshot,action,p,requestId,at,id){
 if(!p||typeof p!=='object'||Array.isArray(p))fail('VALIDATION','Invalid request.');
 var existing=snapshot.events.filter(function(e){return e.requestId===requestId;})[0];if(existing)return existing;
 if(action==='review'){
  var reviewDate=typeof p.weekStart==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p.weekStart)?new Date(p.weekStart+'T12:00:00Z'):null;
  if(!reviewDate||isNaN(reviewDate.getTime())||reviewDate.toISOString().slice(0,10)!==p.weekStart||reviewDate.getUTCDay()!==0)fail('VALIDATION','The review week must start on a valid Sunday.');
  var previous=snapshot.reviews.filter(function(r){return r.weekStart===p.weekStart;})[0];if((previous?previous.version:0)!==p.expectedVersion)fail('CONFLICT','This review changed on another device. Reload and try again.');
  return {id:id,requestId:requestId,itemId:'',kind:'review',at:at,delta:0,unit:'',fromState:'',toState:'',payload:{weekStart:p.weekStart,learned:textValue(p.learned,4000),adjust:textValue(p.adjust,4000),nextStep:textValue(p.nextStep,2000),updatedAt:at,version:(previous?previous.version:0)+1}};
 }
 var before=action==='create'?null:snapshot.items.filter(function(i){return i.id===p.id;})[0];
 if(action!=='create'&&!before)fail('NOT_FOUND','Resource not found.');
 if(before&&p.expectedVersion!==before.version)fail('CONFLICT','This resource changed on another device. Reload and try again.');
 var item=before?Object.assign({},before):{id:id,title:'',type:'Book',coverFileId:'',resourceUrl:'',state:'Parking',unit:'Pages',customUnit:'',current:0,total:null,why:'',doneDefinition:'',nextStep:'',queuePosition:snapshot.items.length+1,addedAt:at,startedAt:'',updatedAt:at,finishedAt:'',version:0};
 var kind=action,delta=0;
 if(action==='create'||action==='update'){
  ['title','type','coverFileId','resourceUrl','unit','customUnit','total','why','doneDefinition','nextStep','queuePosition'].forEach(function(k){if(Object.prototype.hasOwnProperty.call(p,k))item[k]=p[k];});
  if(action==='create'){if(p.state)item.state=p.state;if(p.current!==undefined)item.current=p.current;if(item.state==='Done'||item.state==='Dropped')fail('VALIDATION','Add a resource to Parking, Paused, Main, or Side.');}
  if(before&&before.current>0&&(item.unit!==before.unit||item.customUnit!==before.customUnit))fail('VALIDATION','The progress unit cannot change after progress is recorded.');
 }else if(action==='progress'){
  if(['Main','Side'].indexOf(item.state)<0)fail('VALIDATION','Activate this resource before recording progress.');
  item.current=numberValue(p.current,0);delta=item.current-before.current;if(delta===0)fail('VALIDATION','Progress is unchanged.');
 }else if(action==='state'){
  item.state=choice(p.state,STATES);if(item.state===before.state)fail('VALIDATION','Resource is already in this state.');
 }else fail('ACTION','Unknown action.');
 validateItem(item);slotCheck(snapshot.items,item.state,item.id);
 if((item.state==='Main'||item.state==='Side')&&!item.startedAt)item.startedAt=at;
 item.finishedAt=item.state==='Done'?(before&&before.state==='Done'?before.finishedAt:at):'';
 item.updatedAt=at;item.version++;
 return {id:id,requestId:requestId,itemId:item.id,kind:kind,at:at,delta:delta,unit:item.unit==='Custom'?item.customUnit:item.unit,fromState:before?before.state:'',toState:item.state,payload:item};
}
if(typeof module!=='undefined')module.exports={makeEvent:makeEvent,reduceEvents:reduceEvents,validateItem:validateItem,ITEM_KEYS:ITEM_KEYS};
