import {DRAGON,OVERLORD,type Point} from './map';
export type Rock=Point & {r:number;height:number;pit?:'tyrant'|'overlord'};
export const ROCKS:Rock[]=[];
function wall(x:number,y:number,dx:number,dy:number,count:number){for(let i=0;i<count;i++)ROCKS.push({x:x+dx*i,y:y+dy*i,r:17,height:22+i%3*4});}
wall(230,350,21,8,4);wall(360,695,20,-8,4);wall(570,265,20,8,4);wall(730,665,16,-15,4);
for(const [center,pit,opening] of [[DRAGON,'tyrant',2.35],[OVERLORD,'overlord',.78]] as const){
 for(let i=0;i<20;i++){const a=i*Math.PI/10,d=Math.atan2(Math.sin(a-opening),Math.cos(a-opening));if(Math.abs(d)<1)continue;ROCKS.push({x:center.x+Math.cos(a)*99,y:center.y+Math.sin(a)*87,r:15,height:30+i%3*5,pit});}
}
export function walkable(p:Point,padding=10){return p.x>=25&&p.x<=975&&p.y>=25&&p.y<=975&&!ROCKS.some(r=>Math.hypot(p.x-r.x,p.y-r.y)<r.r+padding);}
export function clearPath(a:Point,b:Point){const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/8);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(!walkable({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}))return false;}return true;}
const N=48,cell=20;
const point=(id:number):Point=>({x:30+(id%N)*cell,y:30+Math.floor(id/N)*cell});
const open=Array.from({length:N*N},(_,i)=>walkable(point(i),12));
const edges=open.map((ok,i)=>{if(!ok)return [];const result:number[]=[];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){if(!x&&!y)continue;const xx=i%N+x,yy=Math.floor(i/N)+y,j=yy*N+xx;if(xx>=0&&xx<N&&yy>=0&&yy<N&&open[j]&&clearPath(point(i),point(j)))result.push(j);}return result;});
function nearest(p:Point){let id=0,best=Infinity;for(let i=0;i<open.length;i++){if(!open[i])continue;const q=point(i),d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<best){best=d;id=i;}}return id;}
export function routeAround(a:Point,b:Point):Point[]{
 if(clearPath(a,b))return [b];
 const start=nearest(a),end=nearest(b),cost=new Float64Array(N*N).fill(Infinity),parent=new Int32Array(N*N).fill(-1),pending=new Set([start]),closed=new Set<number>();cost[start]=0;
 while(pending.size){let current=-1,best=Infinity;for(const id of pending){const p=point(id),q=point(end),f=cost[id]+Math.hypot(p.x-q.x,p.y-q.y);if(f<best){best=f;current=id;}}
  if(current===end){const path:Point[]=[];for(let id=end;id!==start;id=parent[id])path.unshift(point(id));if(walkable(b)&&clearPath(point(end),b))path.push(b);return path;}
  pending.delete(current);closed.add(current);for(const next of edges[current]){if(closed.has(next))continue;const p=point(current),q=point(next),g=cost[current]+Math.hypot(p.x-q.x,p.y-q.y);if(g<cost[next]){cost[next]=g;parent[next]=current;pending.add(next);}}
 }return [];
}
const paths=new WeakMap<object,{goal:Point;path:Point[];at:number}>();
export function steerAround(actor:Point,target:Point,time:number){
 if(clearPath(actor,target))return target;
 let cached=paths.get(actor);if(!cached||Math.hypot(cached.goal.x-target.x,cached.goal.y-target.y)>45||time-cached.at>1){cached={goal:{...target},path:routeAround(actor,target),at:time};paths.set(actor,cached);}
 while(cached.path.length&&Math.hypot(actor.x-cached.path[0].x,actor.y-cached.path[0].y)<9)cached.path.shift();
 return cached.path[0]??actor;
}
export function safeStep(a:Point,b:Point):Point{
 if(clearPath(a,b))return b;
 if(!walkable(a)){const q=point(nearest(a));return q;}
 const x={x:b.x,y:a.y},y={x:a.x,y:b.y};if(clearPath(a,x))return x;if(clearPath(a,y))return y;return {x:a.x,y:a.y};
}
