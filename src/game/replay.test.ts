import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,Director,STEP} from './engine';
import {Replay} from './replay';
test('replay stores independent past states, excludes future moments, and bounds memory',()=>{
 const w=new World(2),r=new Replay();
 for(let i=0;i<450;i++){w.step();r.record(w);}
 assert.ok(r.frames.length<=362);
 assert.ok(r.frames.every(f=>f.moments.every(e=>e.done)));
 assert.ok(r.start(5));const before=r.world.heroes[0].hp;
 w.heroes[0].hp=1;assert.equal(r.world.heroes[0].hp,before);
 const end=r.end,time=w.time;
 for(let i=0;i<155;i++){w.step();r.record(w);r.step(STEP);}
 assert.ok(w.time>time+5);assert.equal(r.end,end);assert.equal(r.active,false);
});
test('watching replay does not count as capturing concurrent live action',()=>{
 const w=new World(2),d=new Director();
 w.moments=[{time:10,lane:1,kind:'团战四杀',points:500,done:false,winner:0}];
 while(w.time<12){w.step();d.camera.step(w,STEP);d.observe(w,false);}
 assert.equal(d.records[0].grade,'missed');assert.equal(d.caught,0);
});
