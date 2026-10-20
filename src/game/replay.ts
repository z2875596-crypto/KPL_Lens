import {World, Director} from './engine';

/** Bounded history of observed states; replay never steps or mutates the live world. */
export class Replay {
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
  this.director=new Director();this.active=true;return true;
 }
 get world(){return [...this.frames].reverse().find(f=>f.time<=this.cursor)??this.frames[0];}
 step(dt:number){
  if(!this.active)return;
  this.cursor=Math.min(this.end,this.cursor+dt);
  if(this.world)this.director.camera.step(this.world,dt);
  if(this.cursor>=this.end)this.active=false;
 }
 stop(){this.active=false;}
}
