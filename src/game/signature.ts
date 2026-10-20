import type { Hero } from './engine';
export const signatureName={mirror:'见影',umbrella:'岑中归月',charge:'单刀赴会',matrix:'指令 · 创造',thunder:'狂雷击',slam:'豪烈万军',spear:'天翔之龙',formation:'玄雍众将',dragonfire:'薄日掌火',hook:'湮灭之锁',fan:'绽放之舞'};
export type SignatureKind=keyof typeof signatureName;
export type Signature = { kind:SignatureKind; at:number; x:number; y:number; dx:number; dy:number };
export const HERO_SIGNATURES:readonly SignatureKind[]=['mirror','umbrella','matrix','thunder','slam','charge','spear','formation','dragonfire','hook','fan'];
// Only current combat observations can start a cast; no event schedule is read here.
export function updateSignature(h:Hero,target:Hero|undefined,time:number){
 if(h.hp<=0||h.recovery!=='none'||(!h.attacking&&h.signature?.kind!=='fan')){h.signature=null;return;}
 if(h.signature&&time-h.signature.at>=1.25)h.signature=null;
 const kind=HERO_SIGNATURES[h.artId];
 if(!h.attacking||!kind||h.signature||time<h.nextSignature||h.cast<.22||h.cast>.4||!target||target.hp<=0)return;
 const dx=target.x-h.x,dy=target.y-h.y,len=Math.hypot(dx,dy);
 if(len>260||len<1)return;
 h.signature={kind,at:time,x:h.x,y:h.y,dx:dx/len,dy:dy/len};
 h.nextSignature=time+(kind==='mirror'?5:kind==='umbrella'?4:4.5);
}
export function signatureDestination(s:Signature,time:number){
 const age=time-s.at;
 if(age<0||age>1.05)return null;
 if(s.kind==='spear')return {x:s.x+s.dx*Math.min(1,age/.5)*80,y:s.y+s.dy*Math.min(1,age/.5)*80};
 if(!['mirror','umbrella','charge'].includes(s.kind))return null;
 // Fixed cast origin prevents moving targets from dragging the effect around.
 const distance=s.kind==='umbrella'?(age<.7?65:0):s.kind==='mirror'?Math.sin(Math.min(1,age/.9)*Math.PI)*60:Math.min(1,age/.65)*105;
 const dx=s.kind==='umbrella'?-s.dy:s.dx,dy=s.kind==='umbrella'?s.dx:s.dy;
 return {x:s.x+dx*distance,y:s.y+dy*distance};
}


// An outbound leg and a return leg, with a fixed launch direction.
export function fanPosition(s:Signature,time:number){
 const f=Math.max(0,Math.min(1,(time-s.at)/1.25));
 const distance=210*Math.sin(Math.PI*f);
 return {x:s.x+s.dx*distance,y:s.y+s.dy*distance-18,spin:Math.atan2(s.dy,s.dx)+f*Math.PI*4};
}
