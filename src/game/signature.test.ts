import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World} from './engine';
import {updateSignature,signatureDestination,HERO_SIGNATURES,type Signature} from './signature';
test('every active hero casts a distinct signature during a team fight without leaving map bounds',()=>{
 const w=new World(2),seen=new Set<string>();
 w.moments=[{time:12,lane:1,kind:'团战四杀',points:500,done:false,winner:0}];
 while(w.time<14){w.step();for(const h of w.heroes){if(h.signature)seen.add(h.signature.kind);assert.ok(h.x>=35&&h.x<=965&&h.y>=35&&h.y<=965);}}
 assert.deepEqual([...seen].sort(),w.heroes.map(h=>HERO_SIGNATURES[h.artId]).sort());
});
test('all eleven hero identities have distinct skills; stationary casters do not dash',()=>{
 assert.equal(new Set(HERO_SIGNATURES).size,11);
 for(let artId=0;artId<11;artId++){
  const w=new World(2),h=w.heroes[0],enemy=w.heroes[5];h.artId=artId;h.x=100;h.y=100;enemy.x=200;enemy.y=100;h.attacking=true;h.cast=.3;
  updateSignature(h,enemy,1);assert.equal(h.signature?.kind,HERO_SIGNATURES[artId]);
  if(![0,1,5,6].includes(artId))assert.equal(signatureDestination(h.signature!,1.4),null);
 }
});
test('signature casts require a live nearby target and actual release; cooldown prevents stacking',()=>{
 const w=new World(2),h=w.heroes[1],enemy=w.heroes[6];
 h.x=100;h.y=100;enemy.x=200;enemy.y=100;h.attacking=true;h.cast=.1;
 updateSignature(h,enemy,1);assert.equal(h.signature,null);
 h.cast=.3;enemy.hp=0;updateSignature(h,enemy,1);assert.equal(h.signature,null);
 enemy.hp=100;enemy.x=500;updateSignature(h,enemy,1);assert.equal(h.signature,null);
 enemy.x=200;updateSignature(h,enemy,1);assert.equal((h.signature as Signature|null)?.kind,'mirror');
 updateSignature(h,enemy,2.3);assert.equal(h.signature,null);
 updateSignature(h,enemy,3);assert.equal(h.signature,null);
 updateSignature(h,enemy,6);assert.ok(h.signature);
 h.hp=0;updateSignature(h,enemy,6.1);assert.equal(h.signature,null);
});
test('umbrella returns to cast origin, charge stays bounded, and recovery cancels casts',()=>{
 const w=new World(2),h=w.heroes[3],enemy=w.heroes[8];
 h.x=100;h.y=100;enemy.x=200;enemy.y=100;h.attacking=true;h.cast=.3;
 updateSignature(h,enemy,1);const s=h.signature!;assert.equal(s.kind,'umbrella');
 assert.deepEqual(signatureDestination(s,1.4),{x:100,y:165});
 assert.deepEqual(signatureDestination(s,1.9),{x:100,y:100});
 assert.equal(signatureDestination(s,3),null);
 const charge={...s,kind:'charge' as const};assert.deepEqual(signatureDestination(charge,1.8),{x:205,y:100});
 h.recovery='recall';updateSignature(h,enemy,1.5);assert.equal(h.signature,null);
});

