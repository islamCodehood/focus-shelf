import test from 'node:test';
import assert from 'node:assert/strict';
import {localDay,weekSummary} from '../lib/analytics.mjs';

const item=(id,title)=>({id,title});
const event=(id,itemId,at,delta,unit='Pages',kind='progress',fromState='Main',toState='Main')=>({id,requestId:id,itemId,at,delta,unit,kind,fromState,toState,payload:item(itemId,itemId==='a'?'Book A':'Course B')});

test('Cairo local day handles midnight boundary',()=>{assert.equal(localDay('2026-09-19T22:30:00.000Z','Africa/Cairo'),'2026-09-20');});

test('weekly summary counts active days, distinct resources, completion, and net corrections',()=>{const events=[event('1','a','2026-09-20T08:00:00Z',10),event('2','a','2026-09-20T09:00:00Z',-2),event('3','b','2026-09-22T08:00:00Z',1,'Lessons'),event('4','b','2026-09-23T08:00:00Z',0,'Lessons','state','Side','Done')];const result=weekSummary(events,'2026-09-20');assert.equal(result.activeDays,2);assert.equal(result.advanced,2);assert.equal(result.completed,1);assert.deepEqual(result.progress.map(x=>[x.title,x.delta,x.unit]),[['Book A',8,'Pages'],['Course B',1,'Lessons']]);});
