import {CAMPS,DRAGON,OVERLORD} from './map';
import type {Hero} from './engine';
export type Neutral={id:string;name:string;x:number;y:number;hp:number;owner:number;respawn:number;killerId:number|null;lastHit:number;damage:number[];boss:boolean};
export function createNeutrals():Neutral[]{
 return [...CAMPS.map((c,i)=>({id:`camp-${i}`,name:['蓝 Buff','红 Buff','野猪'][c.kind],...c,boss:false})),{id:'river',name:'河道小怪',x:505,y:420,boss:false},{id:'tyrant',name:'暴君',...DRAGON,boss:true},{id:'overlord',name:'主宰',...OVERLORD,boss:true}].map(n=>({...n,hp:100,owner:-1,respawn:0,killerId:null,lastHit:-10,damage:[0,0]}));
}
export const isObjective=(kind:string)=>kind==='关键抢龙'||kind==='主宰争夺';
export const objectiveId=(kind:string)=>kind==='主宰争夺'?'overlord':'tyrant';
export function hitNeutral(n:Neutral,h:Hero,damage:number,time:number){
 if(n.hp<=0||h.hp<=0||h.recovery!=='none'||Math.hypot(h.x-n.x,h.y-n.y)>(n.boss?165:100))return false;
 const actual=Math.min(n.hp,damage);n.hp-=actual;n.damage[h.team]+=actual;n.lastHit=time;
 if(n.hp>0){h.hp=Math.max(1,h.hp-(n.boss?.6:1.2));return false;}
 n.owner=h.team;n.killerId=h.id;n.respawn=time+(n.boss?18:14);return true;
}
export function respawnNeutrals(neutrals:Neutral[],time:number){
 for(const n of neutrals)if(n.hp<=0&&n.respawn&&time>=n.respawn){n.hp=100;n.owner=-1;n.killerId=null;n.respawn=0;n.damage=[0,0];n.lastHit=-10;}
}
