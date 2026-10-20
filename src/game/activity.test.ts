import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newActivity,observeActivity} from './activity';
test('activity hints reflect only observed damage or released attacks',()=>{
 const a=newActivity();observeActivity(a,1,100,100,false);assert.equal(a.lastCombat,-100);assert.equal(a.burstLoss,0);
 observeActivity(a,2,100,100,true);assert.equal(a.lastCombat,2);assert.equal(a.burstLoss,0);
 observeActivity(a,3,100,81,false);assert.equal(a.burstLoss,19);assert.equal(a.burstAt,3);
 observeActivity(a,3.2,81,100,false);assert.equal(a.burstAt,3);assert.equal(a.lastCombat,3);
});
test('small sustained losses do not flash; sudden losses aggregate with a cooldown',()=>{
 const a=newActivity();for(let i=0;i<50;i++)observeActivity(a,i*.1,100-i,99-i,false);assert.equal(a.burstAt,-100);
 observeActivity(a,6,50,40,false);observeActivity(a,6.2,40,30,false);assert.equal(a.burstLoss,20);const at=a.burstAt;
 observeActivity(a,6.4,30,5,false);assert.equal(a.burstAt,at);
});
