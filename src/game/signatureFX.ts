import { Graphics } from 'pixi.js';
import type { Signature } from './signature';
export function drawSignature(g:Graphics,s:Signature,time:number,focused:boolean,detailed=true){
 const age=time-s.at,f=Math.min(1,age/1.25),alpha=Math.min(1,age/.12, (1.25-age)/.25)*(focused?.85:.55);
 if(alpha<=0)return;
 const {x,y,dx,dy}=s,c=s.kind==='mirror'?0xb1e8ff:s.kind==='umbrella'?0xff917d:0x7fe3b0;
 if(!detailed){
  // Keep each caster's signature readable while only three full effects compete for space.
  const colors={mirror:0xb1e8ff,umbrella:0xff917d,charge:0x7fe3b0,matrix:0xffd572,thunder:0xb4b1ff,slam:0xdba16b,spear:0x82d5ff,formation:0xd2b17d,dragonfire:0xffa45e,hook:0x72e0db,fan:0xff9ecb};
  const ink=colors[s.kind];
  if(s.kind==='matrix'||s.kind==='formation')g.rect(x-14,y+3,28,17).stroke({color:ink,width:2,alpha:alpha*.65});
  else if(s.kind==='hook'||s.kind==='thunder')g.moveTo(x-16,y+13).lineTo(x-4,y+4).lineTo(x+4,y+17).lineTo(x+16,y+7).stroke({color:ink,width:2,alpha:alpha*.65});
  else g.moveTo(x-16,y+12).quadraticCurveTo(x,y-3,x+16,y+12).stroke({color:ink,width:3,alpha:alpha*.65});
  return;
 }
 const angle=Math.atan2(dy,dx),travel=Math.sin(Math.PI*f)*130,px=x+dx*travel,py=y+dy*travel;
 if(s.kind==='matrix'){
  // Floating cubic blocks, deliberately hollow so feet and health bars stay visible.
  for(const side of [-1,1]){const bx=x+dx*65-dy*side*22,by=y+dy*65+dx*side*22,r=13;
   g.poly([bx,by-r-12,bx+r,by-12,bx,by+r-12,bx-r,by-12]).stroke({color:0xffd572,width:2,alpha});
   g.moveTo(bx-r,by-12).lineTo(bx-r,by+9).lineTo(bx,by+22).lineTo(bx+r,by+9).lineTo(bx+r,by-12).stroke({color:0xffd572,width:2,alpha});
  }return;
 }
 if(s.kind==='thunder'){
  g.moveTo(x,y-12).lineTo(x+dx*35-dy*13,y+dy*35+dx*13-12).lineTo(x+dx*58+dy*10,y+dy*58-dx*10-12).lineTo(x+dx*95,y+dy*95-12).stroke({color:0xb4b1ff,width:3,alpha});
  g.circle(x,y-12,13+f*8).stroke({color:0xe5dfff,width:1.5,alpha:alpha*.6});return;
 }
 if(s.kind==='slam'){
  const impact=Math.max(0,(f-.25)/.75),r=18+impact*48;
  g.roundRect(x-8,y-48+Math.min(1,f*4)*38,16,32,3).fill({color:0xdba16b,alpha});
  if(impact>0){g.ellipse(x,y+12,r,r*.5).stroke({color:0xe5b77a,width:3,alpha:alpha*(1-impact)});
   for(let k=0;k<3;k++){const a=k*2.1;g.moveTo(x+Math.cos(a)*12,y+12+Math.sin(a)*8).lineTo(x+Math.cos(a)*r,y+12+Math.sin(a)*r*.5).stroke({color:0xdba16b,width:2,alpha});}}
  return;
 }
 if(s.kind==='spear'){
  const tx=x+dx*80,ty=y+dy*80;
  if(f<.5)g.moveTo(tx,ty-65*(1-f*2)).lineTo(tx,ty+8).stroke({color:0x82d5ff,width:3,alpha});
  else g.ellipse(tx,ty+8,16+(f-.5)*55,8+(f-.5)*28).stroke({color:0x82d5ff,width:2,alpha:alpha*(1-f)});
  return;
 }
 if(s.kind==='formation'){
  for(const side of [-1,1]){const bx=x-dx*12-dy*side*28,by=y-dy*12+dx*side*28;
   g.poly([bx-9,by-18,bx+9,by-18,bx+9,by+4,bx,by+12,bx-9,by+4]).fill({color:0x927451,alpha:alpha*.35}).stroke({color:0xd2b17d,width:2,alpha});
   g.moveTo(bx+12,by+10).lineTo(bx+12,by-30).stroke({color:0xd2b17d,width:2,alpha});}
  return;
 }
 if(s.kind==='dragonfire'){
  for(const side of [-1,0,1]){const bx=x+dx*f*125-dy*side*10,by=y+dy*f*125+dx*side*10;
   g.poly([bx+dx*10,by+dy*10,bx-dx*6-dy*5,by-dy*6+dx*5,bx-dx*12,by-dy*12,bx-dx*6+dy*5,by-dy*6-dx*5]).fill({color:side?0xffaa5d:0xffe6b1,alpha});}
  return;
 }
 if(s.kind==='hook'){
  const length=Math.sin(Math.PI*f)*150,bx=x+dx*length,by=y+dy*length;
  for(let k=0;k<7;k++){const t=k/7;g.ellipse(x+dx*length*t,y+dy*length*t,3,2).stroke({color:0x72e0db,width:1.5,alpha});}
  g.moveTo(bx-dx*10,by-dy*10).lineTo(bx+dx*8,by+dy*8).lineTo(bx+dy*10,by-dx*10).lineTo(bx-dx*5+dy*7,by-dy*5-dx*7).stroke({color:0xa0f5eb,width:3,alpha});return;
 }
 if(s.kind==='fan'){
  const spin=angle+f*6;
  g.moveTo(px,py).arc(px,py,22,spin-.9,spin+.9).closePath().fill({color:0xff9ecb,alpha:alpha*.65}).stroke({color:0xffd9e8,width:1.5,alpha});
  for(let k=-1;k<=1;k++)g.moveTo(px,py).lineTo(px+Math.cos(spin+k*.7)*22,py+Math.sin(spin+k*.7)*22).stroke({color:0xffe5cd,width:1,alpha});return;
 }
 if(s.kind==='mirror'){
  g.ellipse(x+dx*30,y+dy*30,70,48).stroke({color:c,width:1.5,alpha:alpha*.6});
  for(let k=0;k<6;k++){const a=k*Math.PI/3,px=x+dx*30+Math.cos(a)*70,py=y+dy*30+Math.sin(a)*48;
   g.poly([px,py-6,px+3,py,px,py+6,px-3,py]).fill({color:c,alpha});}
  const travel=Math.sin(f*Math.PI)*60;
  g.moveTo(x-dy*18,y+dx*18).lineTo(x+dx*travel-dy*18,y+dy*travel+dx*18).stroke({color:c,width:3,alpha});
 }else if(s.kind==='umbrella'){
  // A stationary parasol makes the departure and return point readable.
  const r=18,spin=age*2;
  for(let k=0;k<8;k++){const a=spin+k*Math.PI/4,b=a+Math.PI/4;
   g.poly([x,y-12,x+Math.cos(a)*r,y-12+Math.sin(a)*r*.65,x+Math.cos(b)*r,y-12+Math.sin(b)*r*.65]).fill({color:k%2?0xffc1a2:0xe86d78,alpha});}
  g.moveTo(x,y-12).lineTo(x,y+11).stroke({color:0xffdeb0,width:2,alpha});
  for(let k=0;k<3;k++){const t=(f+k*.22)%1,px=x-dy*65*t,py=y+dx*65*t;
   g.poly([px-4,py,px,py-3,px+5,py,px,py+3]).fill({color:c,alpha:alpha*.7});}
 }else{
  const reach=Math.min(1,age/.65)*105,px=x+dx*reach,py=y+dy*reach,angle=Math.atan2(dy,dx);
  for(const offset of [-12,12])g.moveTo(x-dy*offset,y+dx*offset).lineTo(px-dy*offset,py+dx*offset).stroke({color:c,width:2,alpha:alpha*.6});
  if(age>.25)g.moveTo(px+Math.cos(angle-.9)*35,py-6+Math.sin(angle-.9)*35).arc(px,py-6,35,angle-.9,angle+.9).stroke({color:c,width:5,alpha});
  // Two short hoof marks, not a full-screen cavalry wall.
  for(const offset of [-10,10])g.ellipse(px-dx*22-dy*offset,py-dy*22+dx*offset,5,3).fill({color:0xe7d8ad,alpha:alpha*.6});
 }
}

