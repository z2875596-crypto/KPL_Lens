import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,Director,type Moment} from './engine';
import {hitNeutral,respawnNeutrals} from './neutrals';
test('neutral damage requires a living in-range hero; final hit and respawn are exclusive',()=>{
 const w=new World(2),n=w.neutrals[0],h=w.heroes[1];h.x=900;h.y=900;
 hitNeutral(n,h,100,1);assert.equal(n.hp,100);h.x=n.x;h.y=n.y;h.hp=0;
 hitNeutral(n,h,100,1);assert.equal(n.hp,100);h.hp=100;
 assert.equal(hitNeutral(n,h,60,2),false);assert.equal(n.hp,40);assert.ok(h.hp<100);
 assert.equal(hitNeutral(n,h,40,3),true);assert.equal(n.killerId,h.id);
 assert.equal(hitNeutral(n,h,40,4),false);respawnNeutrals(w.neutrals,16);assert.equal(n.hp,0);
 respawnNeutrals(w.neutrals,17);assert.equal(n.hp,100);assert.equal(n.owner,-1);assert.equal(n.killerId,null);
});
for(const kind of ['关键抢龙','主宰争夺'])test(`${kind}: actual finishing hero gets ownership, reward and post-event announcement`,()=>{
 const w=new World(2),d=new Director(),e:Moment={time:10,lane:1,kind,points:400,done:false,winner:1};w.moments=[e];
 while(!e.done&&w.time<15){w.step();d.observe(w);if(!e.done){assert.equal(e.operatorId,undefined);assert.equal(d.chat.length,0);}}
 assert.ok(e.done&&e.stolen);const n=kind==='关键抢龙'?w.dragon:w.overlord;
 assert.equal(n.killerId,e.operatorId);assert.equal(n.owner,e.winner);assert.equal(w.keyHero(e).id,n.killerId);
 assert.equal((kind==='关键抢龙'?w.dragons:w.overlords)[e.winner!],1);
 assert.equal((kind==='关键抢龙'?w.overlords:w.dragons).reduce((a,b)=>a+b),0);
 const respawn=n.respawn;while(w.time<respawn+.1)w.step();assert.equal(n.hp,100);
});
test('idle junglers farm camps and receive one kill reward, without camera input',()=>{
 const w=new World(2);w.moments=[];let killed=false;
 for(let i=0;i<450;i++){w.step();killed ||= w.neutrals.some(n=>!n.boss&&n.hp===0&&n.killerId!==null);}
 assert.ok(killed);assert.ok(w.heroes.some(h=>h.gold>300+w.time*18+64));
});
test('dead designated challenger cannot be credited with a steal',()=>{
 const w=new World(2),e:Moment={time:10,lane:1,kind:'主宰争夺',points:400,done:false,winner:1};w.moments=[e];w.heroes[6].hp=0;w.heroes[6].deadUntil=30;
 while(!e.done&&w.time<17)w.step();assert.ok(e.done);assert.notEqual(e.operatorId,6);assert.equal(e.stolen,false);
});
