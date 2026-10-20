import type {Hero} from './engine';
import {fanPosition} from './signature';

// Resolve only visible, already released skills. No scheduled moments are consulted.
export function updateCombos(heroes:Hero[],time:number,dt:number){
 for(const caster of heroes){
  const s=caster.signature;
  if(!s||caster.hp<=0||caster.recovery!=='none')continue;
  if(s.kind==='hook'){
   const age=time-s.at;
   if(s.hookedId===undefined&&age>=0&&age<=.625){
    const reach=Math.sin(Math.PI*age/1.25)*150;
    const candidates=heroes.filter(h=>{
     const x=h.x-s.x,y=h.y-s.y,along=x*s.dx+y*s.dy;
     return h.team!==caster.team&&h.hp>0&&h.recovery==='none'&&along>25&&along<=reach+12&&Math.abs(x*s.dy-y*s.dx)<22;
    }).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));
    if(candidates[0]){s.hookedId=candidates[0].id;s.hookedAt=time;}
   }
   const victim=heroes.find(h=>h.id===s.hookedId);
   if(!victim||victim.hp<=0||victim.recovery!=='none')continue;
   const elapsed=time-s.hookedAt!;
   if(elapsed<.55){
    const blend=Math.min(1,dt*10);
    victim.x+=(caster.x+s.dx*40-victim.x)*blend;
    victim.y+=(caster.y+s.dy*40-victim.y)*blend;
    victim.vx=0;victim.vy=0;victim.attacking=false;victim.signature=null;
   }
   s.tipX=victim.x;s.tipY=victim.y;
   if(elapsed<.2||elapsed>.75||s.comboFired)continue;
   const ally=heroes.find(h=>h.team===caster.team&&h.artId===10&&h.hp>0&&h.recovery==='none'&&!h.signature&&time>=h.nextSignature&&Math.hypot(h.x-victim.x,h.y-victim.y)<=210);
   if(!ally)continue;
   const dx=victim.x-ally.x,dy=victim.y-ally.y,len=Math.hypot(dx,dy);
   if(len<1)continue;
   ally.signature={kind:'fan',at:time,x:ally.x,y:ally.y,dx:dx/len,dy:dy/len,comboTarget:victim.id};
   ally.nextSignature=time+4.5;ally.targetId=victim.id;ally.attacking=true;ally.cast=.3;
   s.comboFired=true;
  }else if(s.kind==='fan'&&s.comboTarget!==undefined&&!s.comboHit){
   const victim=heroes.find(h=>h.id===s.comboTarget),p=fanPosition(s,time);
   if(victim&&victim.hp>0&&victim.recovery==='none'&&Math.hypot(p.x-victim.x,p.y+18-victim.y)<30){
    victim.hp=Math.max(1,victim.hp-10);s.comboHit=true;
   }
  }
 }
}
