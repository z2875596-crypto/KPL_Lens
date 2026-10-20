import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,Director,STEP,type Moment} from './engine';
import {Camera,mapPoint} from './camera';
import {DRAGON,FRONTS} from './map';
const event=(kind='极限反杀',lane=1,time=10):Moment=>({time,lane,kind,points:kind==='单点击杀'?100:kind==='关键抢龙'?400:300,done:false,winner:0});
function sample(e:Moment,at=-100,zoom=1){const w=new World(12),d=new Director();w.moments=[e];d.camera.zoom=zoom;d.camera.span=[360,540,740][zoom];d.camera.focus(at<0?FRONTS[e.lane]:{x:60,y:60});d.camera.center={...d.camera.target};while(w.time<12){w.step();if(w.time>=at&&at>=0)d.camera.focus(FRONTS[e.lane]);d.camera.step(w,STEP);d.observe(w);}return{w,d};}
test('full, effective, late and missed coverage have distinct results',()=>{
 assert.equal(sample(event()).d.records[0].grade,'complete');
 assert.equal(sample(event(),9.3).d.records[0].grade,'effective');
 assert.equal(sample(event(),10.45).d.records[0].grade,'late');
 const missed=sample(event(),99).d;assert.equal(missed.records[0].grade,'missed');assert.equal(missed.accidents,1);
});
test('a wide small-fight shot loses detail bonus; camera coordinates decide capture',()=>{
 const standard=sample(event()),wide=sample(event(),-1,2);
 assert.equal(standard.d.records[0].grade,'complete');assert.equal(wide.d.records[0].grade,'effective');assert.ok(wide.d.score<standard.d.score);
 const w=new World(5),d=new Director();w.moments=[event()];d.camera.center={x:60,y:60};d.camera.focus({x:60,y:60});for(let i=0;i<360;i++){w.step();d.camera.step(w,STEP);d.observe(w);}assert.equal(d.caught,0);
});
test('simultaneous smaller event is waived when the dragon is captured, independent of input order',()=>{
 for(const reverse of [false,true]){
  const w=new World(4),d=new Director();const major={...event('关键抢龙'),actors:[1,2,3,4,6,7,8,9]},minor={...event('单点击杀',0),actors:[0,5]};w.moments=reverse?[minor,major]:[major,minor];d.camera.focus(DRAGON);d.camera.center={...DRAGON};d.camera.zoom=2;d.camera.span=740;
  while(w.time<12){w.step();d.camera.step(w,STEP);d.observe(w);}
  assert.ok(['complete','effective'].includes(d.records.find(r=>r.event===major)!.grade));assert.equal(d.records.find(r=>r.event===minor)!.grade,'waived');assert.equal(d.accidents,0);assert.ok(d.score>=400);assert.equal(d.combo,1);
 }
});
test('smaller capture does not excuse missing the larger event',()=>{
 const w=new World(8),d=new Director();w.moments=[{...event('关键抢龙'),actors:[1,2,3,4,6,7,8,9]},{...event('单点击杀',0),actors:[0,5]}];d.camera.focus(FRONTS[0]);d.camera.center={...FRONTS[0]};while(w.time<12){w.step();d.camera.step(w,STEP);d.observe(w);}assert.equal(d.records.find(r=>r.event.kind==='关键抢龙')!.grade,'missed');assert.equal(d.accidents,1);
});
test('follow is observational, preserves zoom and holds position after death and respawn',()=>{
 const w=new World(2),c=new Camera();c.setZoom(0);c.follow(1,w);for(let i=0;i<60;i++)c.step(w,STEP);assert.equal(c.heroId,1);assert.equal(c.zoom,0);
 w.heroes[1].hp=0;c.step(w,STEP);const held={...c.center};w.heroes[1].x=999;w.heroes[1].hp=100;c.step(w,STEP);assert.equal(c.mode,'free');assert.equal(c.heroId,null);assert.deepEqual(c.center,held);
 c.follow(2,w);assert.equal(c.zoom,0);c.pan(50,0);assert.equal(c.mode,'free');
});
test('zoom is bounded, smooth, and minimap input respects letterboxing',()=>{
 const c=new Camera(),w=new World(1);c.setViewport(1000,300);c.setZoom(-10);assert.equal(c.zoom,0);c.step(w,STEP);assert.ok(c.span<540&&c.span>360);c.setZoom(10);assert.equal(c.zoom,2);for(let i=0;i<300;i++)c.step(w,STEP);assert.ok(c.frame().width<750&&c.frame().height<550);
 assert.deepEqual(mapPoint(100,50,200,100),{x:500,y:500});assert.equal(mapPoint(0,50,200,100),null);
 c.focus({x:5000,y:-5000});for(let i=0;i<120;i++)c.step(w,STEP);const f=c.frame();assert.ok(f.x>=0&&f.y>=0&&f.x+f.width<=1000&&f.y+f.height<=1000);
});
test('event chat is post-event only, capped, and uses simulated time',()=>{
 const w=new World(10),d=new Director();w.moments=[event('关键抢龙')];d.camera.focus({x:80,y:80});d.camera.center={x:80,y:80};while(w.time<10.1){w.step();d.camera.step(w,STEP);d.observe(w);}assert.equal(d.chat.length,0);
 while(w.time<12){w.step();d.camera.step(w,STEP);d.observe(w);}assert.ok(d.chat.some(m=>m.text.includes('龙谁抢')));assert.ok(d.chat.every(m=>m.at>10));const before=JSON.stringify(d.chat);d.observe(w);assert.equal(JSON.stringify(d.chat),before);assert.ok(d.chat.length<=18);
});
test('damage trail remains above health after damage and locations derive from world state',()=>{const w=new World(4);w.moments=[event()];while(w.time<9)w.step();const h=w.heroes.find(h=>h.team===0&&h.role===1)!;assert.ok(h.trailHp>h.hp);assert.ok(h.lastDamage>8);});
