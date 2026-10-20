export type Point = { x: number; y: number };
export const BASES: Point[] = [{ x: 110, y: 870 }, { x: 890, y: 130 }];
export const ROUTES: Point[][] = [
  [BASES[0], {x:130,y:540}, {x:160,y:210}, {x:470,y:140}, BASES[1]],
  [BASES[0], {x:330,y:660}, {x:500,y:500}, {x:690,y:320}, BASES[1]],
  [BASES[0], {x:520,y:860}, {x:850,y:790}, {x:880,y:460}, BASES[1]],
];
export const FRONTS: Point[] = [{x:285,y:182}, {x:500,y:500}, {x:755,y:810}];
export const DRAGON: Point = {x:650,y:555};
export const OVERLORD: Point = {x:350,y:350};
export const CAMPS = [{x:285,y:420,kind:0},{x:410,y:755,kind:1},{x:600,y:225,kind:1},{x:755,y:585,kind:0},{x:335,y:580,kind:2},{x:670,y:415,kind:2}];
export const TOWERS = ROUTES.flatMap((route,lane)=>[.17,.31,.7,.84].map((t,i)=>({...routePoint(lane,t),team:i<2?0:1,lane,id:lane*4+i})));
export function routePoint(lane:number,t:number):Point {
 const route=ROUTES[lane], lengths=route.slice(1).map((p,i)=>Math.hypot(p.x-route[i].x,p.y-route[i].y)),total=lengths.reduce((a,b)=>a+b,0);
 let distance=Math.max(0,Math.min(1,t))*total;
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const f=distance/lengths[i];return{x:route[i].x+(route[i+1].x-route[i].x)*f,y:route[i].y+(route[i+1].y-route[i].y)*f};}distance-=lengths[i];}
 return route.at(-1)!;
}
export function eventPoint(kind:string,lane:number,winner=0):Point {return kind==='主宰争夺'?OVERLORD:kind==='关键抢龙'?DRAGON:kind==='水晶告破'?BASES[1-winner]:FRONTS[lane];}

export function regionAt(p:Point):string {
 if(Math.hypot(p.x-OVERLORD.x,p.y-OVERLORD.y)<75)return '主宰坑';
 if(Math.hypot(p.x-DRAGON.x,p.y-DRAGON.y)<95)return '龙坑';
 for(let i=0;i<2;i++)if(Math.hypot(p.x-BASES[i].x,p.y-BASES[i].y)<100)return i?'红方基地':'蓝方基地';
 if(Math.abs(p.x-p.y)<65)return '河道';
 let best=Infinity,lane=1;
 ROUTES.forEach((route,index)=>route.slice(1).forEach((b,i)=>{const a=route[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy))),distance=Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);if(distance<best){best=distance;lane=index;}}));
 return best<65?['对抗路','中路','发育路'][lane]:p.y>p.x?'蓝方野区':'红方野区';
}

