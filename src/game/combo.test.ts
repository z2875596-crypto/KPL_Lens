import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World} from './engine';
import {updateCombos} from './combo';
function setup(){
 const w=new World(2),hook=w.heroes[9],fan=w.heroes[7],victim=w.heroes[0];
 for(const h of w.heroes){h.x=800;h.y=800;}
 hook.x=100;hook.y=100;fan.x=100;fan.y=160;victim.x=210;victim.y=100;
 hook.signature={kind:'hook',at:0,x:100,y:100,dx:1,dy:0};
 return {hook,fan,victim,heroes:w.heroes};
}
test('a landed hook pulls first and triggers one available allied fan; damage requires contact',()=>{
 const {hook,fan,victim,heroes}=setup();
 updateCombos(heroes,.1,1/30);assert.equal(hook.signature!.hookedId,undefined);
 updateCombos(heroes,.4,1/30);assert.equal(hook.signature!.hookedId,victim.id);assert.ok(victim.x<210);assert.equal(fan.signature===null,true);
 updateCombos(heroes,.65,1/30);assert.equal(fan.signature?.kind,'fan');assert.equal(fan.signature?.comboTarget,victim.id);
 const cast=fan.signature;assert.equal(victim.hp,100);
 for(let t=.68;t<1.8;t+=1/30)updateCombos(heroes,t,1/30);
 assert.equal(fan.signature,cast);assert.equal(victim.hp,90);
});
test('a missed hook or unavailable Xiaoqiao cannot trigger the combo',()=>{
 for(const reason of ['miss','dead','cooldown','far']){
  const {hook,fan,victim,heroes}=setup();
  if(reason==='miss')victim.y=170;
  if(reason==='dead')fan.hp=0;
  if(reason==='cooldown')fan.nextSignature=10;
  if(reason==='far')fan.x=800;
  for(let t=0;t<1.25;t+=1/30)updateCombos(heroes,t,1/30);
  assert.equal(fan.signature===null,true);
  if(reason==='miss')assert.equal(hook.signature!.hookedId,undefined);
 }
});

