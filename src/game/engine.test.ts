import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,Director} from './engine';
test('camera actions do not change deterministic battle state',()=>{
 const a=new World(42),b=new World(42),d=new Director();
 for(let i=0;i<5401;i++){a.step();b.step();if(i%20===0)d.follow(i%10,b);if(i%50===0)d.camera.setZoom(i%3);d.camera.step(b,1/30);d.observe(b);}
 assert.deepEqual(a.heroes,b.heroes);assert.deepEqual(a.moments.map(({caught,...e})=>e),b.moments.map(({caught,...e})=>e));assert.equal(a.time,180);assert.ok(a.moments.every(e=>e.done));assert.equal(a.heroes.length,10);
});
test('rapid target cuts penalized while identical selection is ignored',()=>{
 const d=new Director();d.score=100;d.switch(0,1);d.switch(1,1.1);d.switch(2,1.2);d.switch(0,1.3);assert.equal(d.score,80);d.switch(0,1.4);assert.equal(d.lastCut,1.3);
});
test('counterattack preserves a critically wounded winner and defeats the pursuer',()=>{
 const w=new World(1);w.moments=[{time:10,lane:1,kind:'极限反杀',points:300,done:false,winner:0}];
 while(w.time<9)w.step();
 assert.ok(w.heroes.filter(h=>h.team===0&&h.lane===1).every(h=>h.hp<=22));
 while(w.time<10.2)w.step();
 assert.equal(w.heroes.find(h=>h.team===1&&h.role===1)!.hp,0);
 assert.ok(w.heroes.filter(h=>h.team===0&&h.lane===1).every(h=>h.hp>0&&h.hp<15&&h.shield===1));
 assert.deepEqual(w.kills,[1,0]);
});
test('dragon loses health before a steal, changes ownership, then respawns',()=>{
 const w=new World(2);w.moments=[{time:10,lane:1,kind:'关键抢龙',points:400,done:false,winner:1}];
 while(w.time<9)w.step();assert.ok(w.dragon.hp>0&&w.dragon.hp<100);
 while(w.time<10.1)w.step();assert.equal(w.dragon.hp,0);assert.equal(w.dragon.owner,1);
 assert.equal(w.heroes.filter(h=>h.lane===1).length,10);
 while(w.time<29)w.step();assert.equal(w.dragon.hp,w.time>=w.dragon.respawn?100:0);assert.equal(w.dragon.owner,-1);
});
test('team fight assembles ten heroes and produces exactly four deaths',()=>{
 const w=new World(3);w.moments=[{time:10,lane:1,kind:'团战四杀',points:500,done:false,winner:0}];
 while(w.time<9)w.step();assert.equal(w.heroes.filter(h=>h.lane===1).length,10);
 assert.ok(w.heroes.every(h=>Math.hypot(h.x-500,h.y-500)<200));
 while(w.time<10.1)w.step();assert.equal(w.heroes.filter(h=>h.hp===0).length,4);assert.deepEqual(w.kills,[4,0]);
});

test('scoreboard kills match hero KDA and team economy includes combat rewards',()=>{
 const w=new World(11);w.moments=[{time:10,lane:1,kind:'团战四杀',points:500,done:false,winner:0}];
 while(w.time<10.1)w.step();
 assert.equal(w.heroes.filter(h=>h.team===0).reduce((n,h)=>n+h.kills,0),w.kills[0]);
 assert.equal(w.heroes.filter(h=>h.team===1).reduce((n,h)=>n+h.deaths,0),w.kills[0]);
 assert.equal(w.heroes.find(h=>h.team===0&&h.role===1)!.kills,4);
 assert.equal(w.heroes.find(h=>h.team===0&&h.role===2)!.assists,4);
 assert.ok(Math.abs(w.gold[0]-w.gold[1]-2000)<=1);assert.equal(w.matchWinner,0);
});
test('dragon counter persists after respawn and crystal result decides the round',()=>{
 const w=new World(12);w.moments=[{time:10,lane:1,kind:'关键抢龙',points:400,done:false,winner:1},{time:25,lane:2,kind:'水晶告破',points:500,done:false,winner:0}];
 while(w.time<26)w.step();
 assert.deepEqual(w.dragons,[0,1]);assert.equal(w.dragon.hp,w.time>=w.dragon.respawn?100:0);
 assert.ok(w.gold[1]>w.gold[0]);assert.equal(w.matchWinner,0);
});


test('dragon entry is a continuous dash and the highlighted operator owns the objective',()=>{
 const w=new World(2);const e={time:10,lane:1,kind:'关键抢龙',points:400,done:false,winner:1};w.moments=[e];let dashed=false,maxStep=0;
 while(w.time<10.2){const hero=w.keyHero(e),before={x:hero.x,y:hero.y};w.step();dashed ||= hero.dashing;maxStep=Math.max(maxStep,Math.hypot(hero.x-before.x,hero.y-before.y));}
 assert.ok(dashed);assert.ok(maxStep<19,'no teleport on objective resolution');assert.equal(w.keyHero(e).team,w.dragon.owner);assert.ok(Math.hypot(w.keyHero(e).x-w.dragon.x,w.keyHero(e).y-w.dragon.y)<85);
});
test('counterattack operator visibly dashes before the finishing blow',()=>{
 const w=new World(1);const e={time:10,lane:1,kind:'极限反杀',points:300,done:false,winner:0};w.moments=[e];let turn=false;
 while(w.time<10.1){w.step();const hero=w.keyHero(e);if(hero.dashing&&hero.hp<22&&hero.shield)turn=true;}
 assert.ok(turn);assert.equal(w.keyHero(e).kills,1);
});

test('field health persists between events and never resets upward',()=>{
 const w=new World(1);w.moments=[];const h=w.heroes[1];h.hp=46;
 for(let i=0;i<90;i++)w.step();assert.ok(h.hp<=46);
 w.moments=[{time:w.time+7,lane:1,kind:'极限反杀',points:300,done:false,winner:0}];
 let previous=h.hp;for(let i=0;i<260;i++){w.step();assert.ok(h.hp<=previous);previous=h.hp;}
});
test('low health retreats, channels recall, then heals only in its fountain',()=>{
 const w=new World(4);w.moments=[];const h=w.heroes[1];h.hp=12;let recalled=false,healed=false;
 for(let i=0;i<330;i++){const previous=h.hp;w.step();if(h.recovery==='recall')recalled=true;if(h.hp>previous){healed=true;assert.ok(Math.hypot(h.x-110,h.y-870)<1);}if(h.recovery==='retreat'||h.recovery==='recall')assert.equal(h.hp,12);}
 assert.ok(recalled&&healed);assert.equal(h.hp,100);
});

