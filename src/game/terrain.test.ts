import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROCKS,walkable,clearPath,routeAround,steerAround,safeStep} from './terrain';
import {DRAGON,OVERLORD} from './map';
test('both pits have open entrances and routes from the surrounding jungle',()=>{
 for(const target of [DRAGON,OVERLORD])for(const start of [{x:500,y:500},{x:800,y:300},{x:200,y:600}]){
  assert.ok(walkable(start)&&walkable(target));const path=routeAround(start,target);assert.ok(path.length);
  let p=start;for(const q of path){assert.ok(clearPath(p,q));p=q;}assert.ok(Math.hypot(p.x-target.x,p.y-target.y)<2);
 }
});
test('ordinary movement goes around a wall instead of crossing or becoming stuck',()=>{
 const actor={x:210,y:300},goal={x:300,y:480};assert.equal(clearPath(actor,goal),false);
 for(let i=0;i<450;i++){const target=steerAround(actor,goal,i/30),dx=target.x-actor.x,dy=target.y-actor.y,len=Math.hypot(dx,dy);if(len<1)continue;const moved=safeStep(actor,{x:actor.x+dx/len*Math.min(3,len),y:actor.y+dy/len*Math.min(3,len)});assert.ok(walkable(moved));assert.ok(Math.hypot(moved.x-actor.x,moved.y-actor.y)<=3.01);Object.assign(actor,moved);}
 assert.ok(Math.hypot(actor.x-goal.x,actor.y-goal.y)<5);
});
test('wall collision blocks a large movement step and handles a target inside a rock',()=>{
 const r=ROCKS[0],a={x:r.x-60,y:r.y};const next=safeStep(a,{x:r.x+60,y:r.y});assert.ok(clearPath(a,next));
 const path=routeAround(a,r);assert.ok(path.length);assert.ok(path.every(p=>walkable(p)));
});

