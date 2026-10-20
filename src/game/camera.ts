import type { World } from './engine';
import { FRONTS, type Point } from './map';
export const ZOOMS = [{name:'近景',span:360},{name:'标准',span:540},{name:'广角',span:740}] as const;
export type ViewFrame = {x:number;y:number;width:number;height:number;scale:number};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export class Camera {
 mode:'follow'|'free'='free'; heroId:number|null=null; zoom=1; span=540;
 center:Point={x:500,y:500}; target:Point={x:500,y:500}; viewport={width:900,height:450}; notice='点头像跟拍 · 点地图定位 · 拖动画面';
 setViewport(width:number,height:number){if(width>0&&height>0)this.viewport={width,height};}
 setZoom(index:number){this.zoom=clamp(index,0,2);}
 follow(id:number,w:World){const h=w.heroes.find(h=>h.id===id);if(!h)return;this.heroId=h.hp>0?id:null;this.mode=h.hp>0?'follow':'free';this.target={x:h.x,y:h.y};this.notice=h.hp>0?'正在跟拍，拖动可转为自由镜头':'英雄已阵亡，镜头留在交战现场';}
 focus(point:Point){this.mode='free';this.heroId=null;this.target={x:clamp(point.x,0,1000),y:clamp(point.y,0,1000)};this.notice='自由镜头 · 滚轮或按钮切换景别';}
 lane(index:number){this.focus(FRONTS[index]);}
 pan(dx:number,dy:number){const f=this.frame();this.mode='free';this.heroId=null;this.target={x:clamp(f.x+f.width/2-dx/f.scale,0,1000),y:clamp(f.y+f.height/2-dy/f.scale,0,1000)};this.center={...this.target};this.notice='自由镜头 · 点头像恢复跟拍';}
 step(world:World,dt:number){
  if(this.mode==='follow'){
   const h=world.heroes.find(h=>h.id===this.heroId);
   if(!h||h.hp<=0){this.mode='free';this.heroId=null;this.target={...this.center};this.notice='跟拍英雄阵亡 · 留在现场，等待你的下一次切镜';}
   else {
    const nearby=world.heroes.filter(o=>o.team!==h.team&&o.hp>0&&Math.hypot(o.x-h.x,o.y-h.y)<220);
    const opponent=nearby.sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0];
    this.target={x:h.x+(opponent?(opponent.x-h.x)*.32:0),y:h.y-15+(opponent?(opponent.y-h.y)*.32:0)};
   }
  }
  const ease=1-Math.exp(-8*dt);this.center.x+=(this.target.x-this.center.x)*ease;this.center.y+=(this.target.y-this.center.y)*ease;this.span+=(ZOOMS[this.zoom].span-this.span)*ease;
 }
 frame():ViewFrame {
  const {width:w,height:h}=this.viewport,scale=Math.max(w/this.span,h/(this.span*.72));
  const width=w/scale,height=h/scale;
  return {x:clamp(this.center.x-width/2,0,1000-width),y:clamp(this.center.y-height/2,0,1000-height),width,height,scale};
 }
}
export function contains(frame:ViewFrame,p:Point,margin=0){return p.x>=frame.x+frame.width*margin&&p.x<=frame.x+frame.width*(1-margin)&&p.y>=frame.y+frame.height*margin&&p.y<=frame.y+frame.height*(1-margin);}
/** Same centered 1010-unit square as the Pixi overview, including letterboxing. */
export function mapPoint(x:number,y:number,width:number,height:number):Point|null {
 const scale=Math.min(width,height)/1010,wx=(x-width/2)/scale+500,wy=(y-height/2)/scale+500;
 return wx<0||wx>1000||wy<0||wy>1000?null:{x:wx,y:wy};
}
