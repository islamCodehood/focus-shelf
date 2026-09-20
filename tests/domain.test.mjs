import test from 'node:test';
import assert from 'node:assert/strict';
import domain from '../apps-script/domain.js';

const now='2026-09-20T09:00:00.000Z';
const empty=()=>({items:[],reviews:[],events:[],timeZone:'Africa/Cairo'});
const create=(overrides={},requestId='11111111-1111-4111-8111-111111111111')=>domain.makeEvent(empty(),'create',{title:'Clean Code',type:'Book',state:'Parking',unit:'Pages',customUnit:'',current:0,total:300,coverFileId:'',resourceUrl:'',why:'',doneDefinition:'',nextStep:'Read 5 pages',queuePosition:1,...overrides},requestId,now,'item-1');

test('creates a validated parking item',()=>{const event=create();assert.equal(event.payload.state,'Parking');assert.equal(event.payload.version,1);assert.equal(event.delta,0);});

test('enforces one resource per active slot',()=>{const first=create({state:'Main'});const snapshot=domain.reduceEvents([first]);assert.throws(()=>domain.makeEvent(snapshot,'create',{...first.payload,id:undefined,title:'Second'},'22222222-2222-4222-8222-222222222222',now,'item-2'),e=>e.code==='SLOT_FULL');});

test('replaying a request id is idempotent',()=>{const first=create();const snapshot=domain.reduceEvents([first]);assert.equal(domain.makeEvent(snapshot,'create',{title:'Ignored'},first.requestId,now,'other'),first);});

test('optimistic version rejects stale progress',()=>{const first=create({state:'Main'});const snapshot=domain.reduceEvents([first]);assert.throws(()=>domain.makeEvent(snapshot,'progress',{id:'item-1',expectedVersion:0,current:10},'33333333-3333-4333-8333-333333333333',now,'event-2'),e=>e.code==='CONFLICT');});

test('progress emits a signed delta and preserves unknown totals',()=>{const first=create({state:'Main',total:null});const snapshot=domain.reduceEvents([first]);const event=domain.makeEvent(snapshot,'progress',{id:'item-1',expectedVersion:1,current:12},'44444444-4444-4444-8444-444444444444',now,'event-2');assert.equal(event.delta,12);assert.equal(event.payload.total,null);});

test('review accepts only a real Sunday',()=>{const valid=domain.makeEvent(empty(),'review',{weekStart:'2026-09-20',learned:'A',adjust:'B',nextStep:'C',expectedVersion:0},'55555555-5555-4555-8555-555555555555',now,'review-1');assert.equal(valid.payload.version,1);assert.throws(()=>domain.makeEvent(empty(),'review',{weekStart:'2026-02-31',expectedVersion:0},'66666666-6666-4666-8666-666666666666',now,'review-2'),e=>e.code==='VALIDATION');});
