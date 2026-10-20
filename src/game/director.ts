import { Camera, contains, type ViewFrame } from './camera';
import { eventPoint, regionAt, type Point } from './map';
import { STEP, type Moment, type World } from './engine';
export type CaptureGrade='complete'|'effective'|'late'|'missed'|'waived';
export const GRADE_LABEL:Record<CaptureGrade,string>={complete:'完整捕捉',effective:'有效捕捉',late:'补到结果',missed:'漏拍',waived:'合理取舍'};
export type CaptureRecord={event:Moment;grade:CaptureGrade;gain:number;lead:number;note:string};
export type ChatMessage={id:number;at:number;row:number;text:string;tone:'praise'|'roast'|'fair'};
type Track={pre:number;preRun:number;burst:number;run:number;post:number;quality:number;samples:number;first:number;view:string};

/** Spatial coverage uses the exact camera rectangle also consumed by the renderer. */
export function coverage(world:World,e:Moment,frame:ViewFrame):number {
 const center=eventPoint(e.kind,e.lane,e.winner);
 if(!contains(frame,center,.08))return 0;
 const actors=world.heroes.filter(h=>world.participates(h,e));
 const major=['团战四杀','关键抢龙','主宰争夺','水晶告破'].includes(e.kind);
 if(major){const visible=actors.filter(h=>contains(frame,{x:h.x,y:h.y-15},.04));return visible.length>=Math.ceil(actors.length*.65)?1:0;}
 const allies=actors.filter(h=>h.team===(e.winner??0));
 const enemies=actors.filter(h=>h.team!==(e.winner??0));
 const attacker=allies.find(h=>h.role===1)??allies[0];
 const victim=e.kind==='极限反杀'?(enemies.find(h=>h.role===1)??enemies[0]):enemies[0];
 if(!attacker||!victim||![attacker,victim].every(h=>contains(frame,{x:h.x,y:h.y-15},.04)))return 0;
 return Math.min(1,440/frame.width);
}
export class Director {
 camera=new Camera();score=0;combo=0;bestCombo=0;heat=50;caught=0;accidents=0;
 lastCut=-10;cuts:number[]=[];feedback='观察血条与位置，点英雄头像跟拍。';records:CaptureRecord[]=[];chat:ChatMessage[]=[];
 private tracks=new Map<Moment,Track>();private settled=new Set<Moment>();private rowTimes=[-10,-10,-10];private chatId=0;private missStreak=0;
 get rate(){const eligible=this.records.filter(r=>r.grade!=='waived');return eligible.length?Math.round(eligible.reduce((n,r)=>n+({complete:1,effective:.8,late:.3,missed:0,waived:0}[r.grade]),0)/eligible.length*100):0;}
 private cut(time:number){this.lastCut=time;this.cuts=this.cuts.filter(t=>time-t<2);this.cuts.push(time);if(this.cuts.length>3){this.score=Math.max(0,this.score-20);this.feedback='切镜过快 −20 · 给观众一点观看时间';this.enqueue(['别切了，晕了','导播在练手速？'],time,'roast');this.cuts=[];}}
 switch(lane:number,time:number){const p=this.camera.target;const before={...p};this.camera.lane(lane);if(before.x!==this.camera.target.x||before.y!==this.camera.target.y)this.cut(time);}
 follow(id:number,world:World){if(this.camera.mode==='follow'&&this.camera.heroId===id)return;this.cut(world.time);this.camera.follow(id,world);}
 focus(point:Point,time:number){if(Math.hypot(point.x-this.camera.target.x,point.y-this.camera.target.y)>20)this.cut(time);this.camera.focus(point);}
 beginPan(time:number){this.cut(time);}
 private describe(world:World){const hero=world.heroes.find(h=>h.id===this.camera.heroId);return hero?`跟拍${hero.team?'红方':'蓝方'}${hero.name.split('·')[0]}（${regionAt(hero)}）`:`镜头停在${regionAt(this.camera.center)}`;}
 observe(world:World):CaptureRecord[] {
  const frame=this.camera.frame();
  for(const e of world.moments){
   if(world.time<e.time-4||world.time>e.time+1.25||this.settled.has(e))continue;
   let t=this.tracks.get(e);if(!t){t={pre:0,preRun:0,burst:0,run:0,post:0,quality:0,samples:0,first:Infinity,view:''};this.tracks.set(e,t);}
   const q=coverage(world,e,frame),dt=world.time-e.time;
   if(Math.abs(dt)<STEP*1.2)t.view=this.describe(world);
   if(q>0){t.first=Math.min(t.first,world.time);t.quality+=q;t.samples++;if(dt<-.6){t.preRun+=STEP;t.pre=Math.max(t.pre,t.preRun);}if(dt>=-.6&&dt<=.4){t.run+=STEP;t.burst=Math.max(t.burst,t.run);}if(dt>.4)t.post+=STEP;}
   else {t.run=0;t.preRun=0;}
  }
  const result:CaptureRecord[]=[];
  const pending=world.moments.filter(e=>!this.settled.has(e)).sort((a,b)=>a.time-b.time);
  // Resolve a cluster together, after its last event; avoids ordering-dependent penalties.
  while(pending.length){const start=pending.shift()!,cluster=[start];while(pending.length&&pending[0].time-start.time<=1.5)cluster.push(pending.shift()!);
   if(cluster.some(e=>!e.done)||world.time<Math.max(...cluster.map(e=>e.time))+1.25)continue;
   const provisional=cluster.map(e=>{const t=this.tracks.get(e),q=t?.samples?t.quality/t.samples:0;let grade:CaptureGrade='missed';if(t&&t.pre>=1.2&&t.burst>=.35&&t.post>=.3&&q>=.72)grade='complete';else if(t&&t.burst>=.35)grade='effective';else if(t&&t.post>=.25)grade='late';return{e,t,q,grade:grade as CaptureGrade};});
   const best=Math.max(0,...provisional.filter(p=>p.grade==='complete'||p.grade==='effective').map(p=>p.e.points));
   provisional.sort((a,b)=>b.e.points-a.e.points).forEach(p=>{
    if(p.grade==='missed'&&p.e.points<best)p.grade='waived';
    const record=this.resolve(p.e,p.grade,p.t,p.q,world.time);result.push(record);this.settled.add(p.e);this.tracks.delete(p.e);
   });
  }
  this.chat=this.chat.filter(m=>world.time-m.at<7.2).slice(-18);
  return result;
 }
 private resolve(e:Moment,grade:CaptureGrade,t:Track|undefined,quality:number,time:number):CaptureRecord {
  let gain=0;const lead=t&&Number.isFinite(t.first)?Math.max(0,e.time-t.first):0;
  let note='';
  if(grade==='complete'||grade==='effective'){
   this.caught++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.heat=Math.min(100,this.heat+9);
   gain=Math.round(e.points*(grade==='complete'?1.25:quality<.72?.75:1)*[1,1.2,1.5,2][Math.min(3,this.combo-1)]);
   note=grade==='complete'?`提前 ${lead.toFixed(1)} 秒入镜，交锋与结果完整呈现。`:quality<.72?'拍到了关键交锋；人物较小，下次可用标准或近景看清操作。':'拍到了关键交锋；提前入镜并留住残局可获得完整捕捉。';
  }else if(grade==='late'){gain=Math.round(e.points*.25);this.heat=Math.min(100,this.heat+2);note='切入时关键动作已过，只补到了结果；下次留意掉血残影和支援位置。';}
  else if(grade==='waived'){note='同期拍到更重要的事件，本次不扣分、不清连击，也不计入镜头完成度分母。';}
  else {gain=-(e.points>=300?200:50);this.heat=Math.max(0,this.heat-12);if(e.points>=300){this.combo=0;this.accidents++;}note=`${t?.view||'镜头未覆盖交战区域'}；关键人物未同时清楚入镜，或停留过短。`;}
  this.score=Math.max(0,this.score+gain);e.caught=grade==='complete'||grade==='effective';
  const r={event:e,grade,gain,lead,note};this.records.push(r);this.feedback=`${GRADE_LABEL[grade]} · ${e.kind}${gain?` ${gain>0?'+':''}${gain}`:' · 免罚'}`;
  this.react(r,time);return r;
 }
 private enqueue(lines:string[],time:number,tone:ChatMessage['tone']){
  for(const text of lines){const row=this.chatId%3,at=Math.max(time,this.rowTimes[row]+7.3);this.rowTimes[row]=at;this.chat.push({id:++this.chatId,at,row,text,tone});}
 }
 private react(r:CaptureRecord,time:number){
  if(r.grade==='complete'||r.grade==='effective'){
   const recovered=this.missStreak>1;this.missStreak=0;
   this.enqueue(r.grade==='complete'?['这预判！导播加鸡腿！','这波从绕后拍到收尾，舒服了',this.combo>=3?'建议给导播单独算个 MVP':recovered?'行，这波给你加回来':'今天的导播有点东西']:['这波切得漂亮！',r.note.includes('人物较小')?'镜头再近一点就更好了':'关键操作看到了，稳'],time,'praise');
  }else if(r.grade==='late')this.enqueue(['好的，带大家欣赏一下案发现场','来晚一步啊导播'],time,'roast');
  else if(r.grade==='waived')this.enqueue(['另一边也在打，这波没办法','大团更重要，切这边没问题'],time,'fair');
  else {
   this.missStreak++;
   const lines=['关键抢龙','主宰争夺'].includes(r.event.kind)?['？？？？？？','龙谁抢的？？？','导播你在拍野猪吗']:r.event.kind==='团战四杀'?['？？？？？？？','四杀都没看到？？？','导播你有什么用啊，找个厂上班吧😂']:r.event.kind==='极限反杀'?['？？？','这都能反杀？导播回头啊！','最精彩的没看到是吧']:['刚才是不是打起来了','导播，镜头跟上啊'];
   if(this.missStreak>=3)lines[lines.length-1]='第三次了哥，镜头和团战总得来一个吧';this.enqueue(lines,time,'roast');
  }
 }
}



