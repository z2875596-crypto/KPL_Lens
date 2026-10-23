import { steerAround, safeStep } from './terrain';
import { updateCombos } from './combo';
import { createNeutrals, hitNeutral, respawnNeutrals, isObjective, objectiveId } from './neutrals';
import { updateSignature, signatureDestination, type Signature } from './signature';
import { HERO_ART, heroLineups } from './heroArt';
import { newActivity, observeActivity, type Activity } from './activity';
import { BASES, FRONTS, DRAGON, eventPoint, routePoint } from './map';
export const LANES = ['对抗路', '中路 · 河道', '发育路'];
export const STEP = 1 / 30;
export type Hero = Activity & { neutralId:string|null; nextNeutralAttack:number; nextSmite:number; signature:Signature|null; nextSignature:number; id: number; artId:number; name: string; team: number; lane: number; x: number; y: number; hp: number; deadUntil: number; role:number; facing:number; attacking:boolean; shield:number; kills:number; deaths:number; assists:number; gold:number; trailHp:number; lastDamage:number; vx:number; vy:number; cast:number; targetId:number; dashing:boolean; recovery:'none'|'retreat'|'recall'|'fountain'; recoveryAt:number };
export type Moment = { time: number; lane: number; kind: string; points: number; done: boolean; caught?: boolean; winner?:number; actors?:number[]; operatorId?:number; stolen?:boolean };
export class World {
 income:{heroId:number;amount:number;source:string;at:number}[]=[];
 reward(h:Hero,amount:number,source:string){h.gold+=amount;this.income.push({heroId:h.id,amount,source,at:this.time});if(this.income.length>80)this.income.shift();}
 recentIncome(id:number){return this.income.filter(g=>g.heroId===id&&this.time-g.at<2);}
 time=0; heroes:Hero[]=[]; moments:Moment[]=[]; seed:number; kills=[0,0]; dragons=[0,0]; overlords=[0,0]; neutrals=createNeutrals(); crystals=[100,100];
 constructor(seed=Date.now()>>>0){
  this.seed=seed;
  const lineups=heroLineups(seed);
  for(let team=0;team<2;team++)for(let role=0;role<5;role++){
   const lane=[0,1,1,2,2][role],p=routePoint(lane,team?.64:.36);
   this.heroes.push({...newActivity(),neutralId:null,nextNeutralAttack:0,nextSmite:0,signature:null,nextSignature:0,id:team*5+role,artId:lineups[team][role],name:HERO_ART[lineups[team][role]].name,team,lane,x:p.x,y:p.y,hp:100,deadUntil:0,role,facing:team?-1:1,attacking:false,shield:0,kills:0,deaths:0,assists:0,gold:300,trailHp:100,lastDamage:-10,vx:0,vy:0,cast:0,targetId:-1,dashing:false,recovery:'none',recoveryAt:0});
  }
  let time=10;
  while(time<176){
   const lane=Math.floor(this.random()*3);
   const choices: [string,number][] = time<45?[['单点击杀',100],['极限反杀',300],['双杀',200]]:time<120?[['团战四杀',500],['极限反杀',300],['关键抢龙',400],['主宰争夺',400]]:[['团战四杀',500],['关键抢龙',400],['主宰争夺',400],['水晶告破',500]];
   const allowed=choices.filter(([kind])=>!isObjective(kind)||!this.moments.some(e=>e.kind===kind&&time-e.time<27));
   const [kind,points]=allowed[Math.floor(this.random()*allowed.length)];
   this.moments.push({time,lane:isObjective(kind)?1:lane,kind,points,done:false,winner:Math.floor(this.random()*2)});
   time+=(time>150?8:11)+this.random()*3;
  }
  // Independent simultaneous objectives reserve different heroes, so no hero fights in two places.
  const overlaps:Moment[]=[];for(const e of this.moments){if(e.time>45&&['关键抢龙','主宰争夺','团战四杀'].includes(e.kind)&&this.random()<.55){const role=e.lane===0?3:0;e.actors=this.heroes.filter(h=>h.role!==role).map(h=>h.id);overlaps.push({time:e.time,lane:role===0?0:2,kind:'单点击杀',points:100,done:false,winner:Math.floor(this.random()*2),actors:this.heroes.filter(h=>h.role===role).map(h=>h.id)});}}this.moments.push(...overlaps);this.moments.sort((a,b)=>a.time-b.time);
 }
 get dragon(){return this.neutrals.find(n=>n.id==='tyrant')!;} 
 get overlord(){return this.neutrals.find(n=>n.id==='overlord')!;}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 get gold(){return [0,1].map(team=>Math.floor(this.heroes.filter(h=>h.team===team).reduce((sum,h)=>sum+Math.floor(h.gold),0)));}
 get matchWinner(){const crystal=this.moments.find(e=>e.done&&e.kind==='水晶告破');if(crystal)return crystal.winner??0;return this.gold[0]===this.gold[1]?(this.moments.filter(e=>e.done).at(-1)?.winner??0):this.gold[0]>this.gold[1]?0:1;}
 get activeMoments(){return this.moments.filter(e=>this.time>=e.time-7&&(this.time<e.time+3||isObjective(e.kind)&&!e.done));}
 get active(){return this.activeMoments[0];}
 get recent(){return this.moments.find(e=>e.done&&this.time-e.time<3);}
 participates(h:Hero,e:Moment){if(e.actors)return e.actors.includes(h.id);return e.kind==='团战四杀'||isObjective(e.kind)||e.kind==='水晶告破'||h.role===1||[0,1,1,2,2][h.role]===e.lane;}
 keyHero(e:Moment){return this.heroes.find(h=>h.id===e.operatorId)?? this.heroes.find(h=>h.team===(e.winner??0)&&h.role===1&&this.participates(h,e))??this.heroes.find(h=>h.team===(e.winner??0)&&this.participates(h,e))!;}
 step(){
  if(this.time>=180)return [];
  this.time=Math.min(180,this.time+STEP);
  const priorHP=this.heroes.map(h=>h.hp);respawnNeutrals(this.neutrals,this.time);
  for(const h of this.heroes){
   h.gold+=STEP*18;const e=this.activeMoments.find(e=>this.participates(h,e)),progress=e?Math.max(0,Math.min(1,1-(e.time-this.time)/7)):0;
   const involved=e&&this.participates(h,e)&&h.recovery==='none',home=[0,1,1,2,2][h.role];
   h.lane=involved?e.lane:home;h.attacking=false;h.shield=0;h.dashing=false;h.cast=0;h.neutralId=null;
   if(h.deadUntil>this.time){h.hp=0;h.vx=0;h.vy=0;continue;}
   if(h.hp===0){h.hp=100;h.x=BASES[h.team].x;h.y=BASES[h.team].y;h.recovery='none';h.deadUntil=0;}
   if(h.recovery==='none'&&!e&&h.hp<35){h.recovery='retreat';h.recoveryAt=this.time;}
   if(h.recovery!=='none'){
    const base=BASES[h.team];h.attacking=false;h.vx=0;h.vy=0;
    if(h.recovery==='retreat'){const waypoint=steerAround(h,base,this.time),dx=waypoint.x-h.x,dy=waypoint.y-h.y,len=Math.hypot(dx,dy);if(len>1){const p=safeStep(h,{x:h.x+dx/len*Math.min(len,100*STEP),y:h.y+dy/len*Math.min(len,100*STEP)});h.x=p.x;h.y=p.y;}if(this.time-h.recoveryAt>=2.5){h.recovery='recall';h.recoveryAt=this.time;}}
    else if(h.recovery==='recall'){if(this.time-h.recoveryAt>=3){h.x=base.x;h.y=base.y;h.recovery='fountain';h.recoveryAt=this.time;}}
    else {h.hp=Math.min(100,h.hp+25*STEP);if(h.hp>=100)h.recovery='none';}
    continue;
   }
   let target=routePoint(home,h.team?.6:.4);
   if(involved){
    const center=eventPoint(e.kind,e.lane,e.winner),sign=h.team?-1:1;
    let distance=130-progress*85+(h.role===2||h.role===3?35:h.role===4?-12:0);
    if(isObjective(e.kind)&&h.team===(e.winner??0))distance=e.done?35:155-progress*35;
    target={x:center.x-sign*distance+[0,8,-18,-26,18][h.role],y:center.y+[-84,-26,38,102,66][h.role]*sign};
    if(e.kind==='极限反杀'&&h.team===(e.winner??0))target.x-=sign*(e.done?-80:25);
    const enemy=this.heroes.filter(o=>o.team!==h.team&&o.hp>0&&this.participates(o,e)).sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0];
    h.targetId=enemy?.id??-1;
    h.attacking=progress>.35&&!e.done;
    h.cast=h.attacking?(this.time+h.id*.19)%[1.1,1.25,1.6,.95,1.8][h.role]/[1.1,1.25,1.6,.95,1.8][h.role]:0;
    const remaining=e.time-this.time,key=this.keyHero(e);
    if(isObjective(e.kind)&&h.id===key.id&&remaining<.55){target={x:center.x-12,y:center.y+14};h.dashing=remaining>0;h.shield=remaining<.15?1:0;}
    if(e.kind==='极限反杀'&&h.id===key.id&&remaining<.48&&remaining>0&&enemy){target={x:enemy.x-sign*30,y:enemy.y+12};h.dashing=true;h.shield=1;}
    if(enemy&&!h.dashing&&h.attacking){target.y+=Math.sin(this.time*2+h.id)*15;h.facing=enemy.x<h.x?-1:1;}

    if(!e.done){
     if(e.kind==='极限反杀')h.hp=Math.min(h.hp,h.team===(e.winner??0)?Math.max(7,100-progress*130):Math.max(6,90-Math.max(0,progress-.78)*380));
     else h.hp=Math.min(h.hp,Math.max(h.team===(e.winner??0)?32:5,100-progress*(h.team===(e.winner??0)?55:94)));
    }else if(e.kind==='极限反杀'&&h.team===(e.winner??0)){h.shield=1;}
   }
   if(involved&&isObjective(e.kind)&&!e.done){
    const boss=this.neutrals.find(n=>n.id===objectiveId(e.kind))!;
    const remaining=e.time-this.time,key=this.keyHero(e),challenger=h.team===(e.winner??0);
    if(boss.hp>0){
     h.neutralId=boss.id;h.targetId=-1;h.signature=null;
     const ready=!challenger||h.id===key.id&&remaining<.55;
     const radius=ready?55:140,angle=h.id*.85;
     target={x:boss.x+Math.cos(angle)*radius,y:boss.y+Math.sin(angle)*radius};
     h.dashing=h.id===key.id&&remaining<.55;
     h.attacking=ready&&progress>.35&&Math.hypot(h.x-boss.x,h.y-boss.y)<165;
     h.cast=h.attacking?(this.time+h.id*.13)%.7/.7:0;
     h.facing=boss.x<h.x?-1:1;
    }
   }else if(!e&&(h.role===1||h.role===3)&&h.hp>=35){
    const camp=this.neutrals.filter(n=>!n.boss&&n.hp>0&&(h.team===0?n.y>n.x:n.y<n.x)).sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0];
    if(camp){h.neutralId=camp.id;h.targetId=-1;h.signature=null;target={x:camp.x+(h.team?-38:38),y:camp.y+18};h.attacking=Math.hypot(h.x-camp.x,h.y-camp.y)<100;h.cast=h.attacking?(this.time+h.id*.13)%.7/.7:0;h.facing=camp.x<h.x?-1:1;}
   }
   const signatureTarget=h.signature&&signatureDestination(h.signature,this.time);
   if(signatureTarget&&h.attacking&&!h.dashing){target=signatureTarget;h.dashing=true;}
   if(!h.dashing){target.x+=Math.sin(this.time*.8+h.id)*7;target.y+=Math.cos(this.time*.9+h.id)*6;}
   for(const other of this.heroes){const separation=Math.hypot(h.x-other.x,h.y-other.y);if(other.id!==h.id&&other.hp>0&&separation>0&&separation<52){target.x+=(h.x-other.x)/separation*(52-separation)*1.1;target.y+=(h.y-other.y)/separation*(52-separation)*1.1;}}
   const crossesWall=h.dashing&&[0,1,6].includes(h.artId); // Mirror, umbrella blink, and spear leap only.
   if(!crossesWall)target=steerAround(h,target,this.time);
   const dx=target.x-h.x,dy=target.y-h.y,len=Math.hypot(dx,dy),speed=h.dashing?520:involved?105:65;
   const casting=h.attacking&&h.cast>.12&&h.cast<.4&&!h.dashing;
   const desired=Math.min(speed,len*4)*(casting?.18:1),blend=h.dashing?.65:.22;
   h.vx+=(len>1?dx/len*desired-h.vx:-h.vx)*blend;h.vy+=(len>1?dy/len*desired-h.vy:-h.vy)*blend;
   const next={x:Math.max(35,Math.min(965,h.x+h.vx*STEP)),y:Math.max(35,Math.min(965,h.y+h.vy*STEP))};
   const moved=crossesWall?next:safeStep(h,next);h.x=moved.x;h.y=moved.y;
   if(!h.attacking&&Math.abs(h.vx)>8)h.facing=h.vx<0?-1:1;

  }
  const neutralDue:Moment[]=[];
  for(const h of this.heroes){
   const n=this.neutrals.find(n=>n.id===h.neutralId);if(!n||!h.attacking||h.hp<=0||this.time<h.nextNeutralAttack||h.cast<.22||h.cast>.55)continue;
   h.nextNeutralAttack=this.time+.65;
   const event=n.boss?this.activeMoments.find(e=>isObjective(e.kind)&&!e.done&&objectiveId(e.kind)===n.id):undefined;
   const smite=event&&h.id===this.keyHero(event).id&&this.time>=event.time-.15&&this.time>=h.nextSmite&&Math.hypot(h.x-n.x,h.y-n.y)<85;
   if(smite)h.nextSmite=this.time+8;
   if(hitNeutral(n,h,smite?40:n.boss?3:20,this.time)){
    if(n.boss){const counts=n.id==='tyrant'?this.dragons:this.overlords;counts[h.team]++;for(const ally of this.heroes.filter(a=>a.team===h.team))this.reward(ally,100,n.name);
     if(event){event.done=true;event.time=this.time;event.operatorId=h.id;event.winner=h.team;event.stolen=n.damage[1-h.team]>n.damage[h.team];neutralDue.push(event);}
    }else this.reward(h,65,n.name);
   }
  }
  const due=this.moments.filter(m=>!m.done&&!isObjective(m.kind)&&m.time<=this.time);
  for(const m of due){
   m.done=true;const winner=m.winner??0;const available=this.heroes.filter(h=>h.hp>0&&h.recovery==='none'&&this.participates(h,m));if(!available.some(h=>h.team===winner))continue;
   if(m.kind==='水晶告破'){this.crystals[1-winner]=0;}
   else{
    const victims=available.filter(h=>h.team!==winner);
    const count=m.kind==='团战四杀'?4:m.kind==='双杀'?2:1;
    // Show the pursued hero actually turning on their pursuer.
    if(m.kind==='极限反杀')victims.sort((a,b)=>Number(b.role===1)-Number(a.role===1));
    for(const h of victims.slice(0,count)){h.deadUntil=this.time+4;h.hp=0;h.deaths++;this.kills[winner]++;const allies=available.filter(a=>a.team===winner);const killer=allies.find(a=>a.role===1)??allies[0];killer.kills++;this.reward(killer,300,`击杀${h.name}`);for(const ally of allies.filter(a=>a!==killer)){ally.assists++;this.reward(ally,50,`助攻${h.name}`);}}
   }
  }
  // Hold a ready fan briefly while a nearby ally's hook is actually in flight.
  for(const h of [...this.heroes].sort((a,b)=>Number(b.artId===9)-Number(a.artId===9))){
   const hook=h.artId===10&&this.heroes.find(a=>a.team===h.team&&a.hp>0&&a.signature?.kind==='hook'&&this.time-a.signature.at<1&&Math.hypot(a.x-h.x,a.y-h.y)<230);
   if(!hook||h.signature)updateSignature(h,this.heroes.find(o=>o.id===h.targetId),this.time);
  }
  updateCombos(this.heroes,this.time,STEP);
  for(const h of this.heroes){const target=this.heroes.find(o=>o.id===h.targetId);observeActivity(h,this.time,priorHP[h.id],h.hp,h.hp>0&&h.attacking&&h.cast>=.22&&h.cast<.75&&!!target&&target.hp>0&&Math.hypot(target.x-h.x,target.y-h.y)<=310);if(h.hp<priorHP[h.id]-.01){h.lastDamage=this.time;h.trailHp=Math.max(h.trailHp,priorHP[h.id]);}else if(h.hp>h.trailHp)h.trailHp=h.hp;if(this.time-h.lastDamage>.6)h.trailHp=Math.max(h.hp,h.trailHp-STEP*30);}
  return [...due,...neutralDue];
 }
}

export { Director } from './director';








