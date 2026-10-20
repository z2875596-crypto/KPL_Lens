import {coverage} from './director';
import {World, Director} from './engine';

/** Bounded history of observed states; replay never steps or mutates the live world. */
export class Replay {
 private watched=new Map<object,{run:number;best:number;post:number}>();
 frames:World[]=[];
 director=new Director();
 cursor=0;end=0;active=false;
 record(world:World){
  const data=structuredClone({...world,moments:world.moments.filter(e=>e.done)});
  this.frames.push(Object.assign(Object.create(World.prototype),data));
  while(this.frames.length&&world.time-this.frames[0].time>12)this.frames.shift();
 }
 start(seconds:number){
  if(this.frames.length<2)return false;
  this.end=this.frames.at(-1)!.time;
  this.cursor=Math.max(this.frames[0].time,this.end-seconds);
  this.watched.clear();this.director=new Director();this.active=true;return true;
 }
 get world(){return [...this.frames].reverse().find(f=>f.time<=this.cursor)??this.frames[0];}
 step(dt:number,live?:World,judge?:Director){
  if(!this.active)return;
  this.cursor=Math.min(this.end,this.cursor+dt);
  if(this.world)this.director.camera.step(this.world,dt);
  if(live&&judge&&this.world){
   for(const e of live.moments.filter(e=>e.done)){
    const offset=this.cursor-e.time;if(offset<-.6||offset>1.25)continue;
    let t=this.watched.get(e);if(!t){t={run:0,best:0,post:0};this.watched.set(e,t);}
    const visible=coverage(this.world,e,this.director.camera.frame())>=.72;
    if(offset<=.4){t.run=visible?t.run+dt:0;t.best=Math.max(t.best,t.run);}
    else if(visible)t.post+=dt;
    if(t.best>=.35&&t.post>=.25)judge.awardReplay(e,live.time);
   }
  }
  if(this.cursor>=this.end)this.active=false;
 }
 stop(){this.active=false;}
}
