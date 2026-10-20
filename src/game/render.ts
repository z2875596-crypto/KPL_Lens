import { isObjective } from './neutrals';
import { createMonsters } from './monsterArt';
import { drawSignature } from './signatureFX';
import { signatureName } from './signature';
import { HERO_ART,HERO_ATLAS } from './heroArt';
import { Application, Assets, Container, Graphics, Rectangle, Sprite, Texture, Text } from 'pixi.js';
import { World, type Hero, type Director } from './engine';
import { contains, mapPoint } from './camera';
import { BASES, ROUTES, TOWERS, CAMPS, DRAGON, OVERLORD, FRONTS, eventPoint, routePoint, type Point } from './map';
const BLUE=0x60caff,RED=0xff7c8c,GOLD=0xffd780;
const teamColor=(team:number)=>team?RED:BLUE;
function line(g:Graphics,points:Point[],color:number,width:number,alpha=1){g.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))g.lineTo(p.x,p.y);g.stroke({color,width,alpha,join:'round',cap:'round'});}
function diamond(g:Graphics,x:number,y:number,r:number,color:number){g.poly([x,y-r,x+r*.65,y,x,y+r,x-r*.65,y]).fill(color);}
function tree(g:Graphics,x:number,y:number,size:number){
 g.ellipse(x+8,y+13,size*1.2,size*.65).fill({color:0x0c2528,alpha:.5});g.roundRect(x-3,y,7,21,3).fill(0x4e4935);
 g.poly([x-size,y+8,x-size*.6,y-12,x-size*.7,y-15,x,y-size*1.7,x+size*.75,y-13,x+size*.6,y-8,x+size,y+8]).fill(0x204d42).stroke({color:0x173f38,width:3});
 g.poly([x-size*.6,y-6,x,y-size*1.7,x+size*.28,y-17,x+size*.15,y-4]).fill(0x3c7560);g.moveTo(x-size*.5,y+1).lineTo(x,y-8).lineTo(x+size*.5,y+2).stroke({color:0x51846b,width:2,alpha:.5});
}
function stone(g:Graphics,x:number,y:number,r:number){g.poly([x-r,y,x-r*.7,y-r*.65,x+r*.35,y-r,x+r,y-r*.25,x+r*.8,y+r*.5,x-r*.3,y+r*.65]).fill(0x4b6461).stroke({color:0x213b39,width:3});g.poly([x-r,y,x-r*.7,y-r*.65,x+r*.35,y-r,x+r*.45,y-r*.3,x-r*.2,y]).fill(0x72817a);}
function terrain(g:Graphics){
 g.roundRect(20,20,960,960,60).fill(0x254d41).stroke({width:18,color:0x162f32});
 // Fine deterministic grass flecks; generated once, never per frame.
 for(let i=0;i<550;i++){const x=40+(i*137%920),y=40+(i*239%920);g.moveTo(x,y).lineTo(x+2,y-4).stroke({color:i%2?0x68825c:0x436e4c,width:1,alpha:.35});}
 const river=[{x:170,y:70},{x:240,y:215},{x:390,y:390},{x:530,y:480},{x:630,y:620},{x:800,y:800},{x:920,y:920}];
 line(g,river,0x183e40,100);line(g,river,0x567a66,85);line(g,river,0x235c65,74);line(g,river,0x307c82,56);line(g,river,0x438d8d,2,.5);
 for(const r of ROUTES){line(g,r,0x163b34,79);line(g,r,0x879078,63);line(g,r,0x657b68,56);line(g,r,0x9da58a,2,.35);}
 for(let lane=0;lane<3;lane++)for(let i=1;i<35;i++){const p=routePoint(lane,i/35);g.roundRect(p.x-13,p.y-8,26,16,3).fill({color:i%3?0x91a18b:0xb1b49a,alpha:.3}).stroke({color:0x344f44,width:1,alpha:.5});}
 // Two jungles with branching paths and buff camps.
 for(const c of CAMPS){line(g,[{x:c.x-50,y:c.y+40},c,{x:c.x+50,y:c.y-30}],0x59735a,25);g.ellipse(c.x,c.y,42,29).fill(0x304b3e).stroke({width:5,color:0x7a8971});for(let j=0;j<5;j++)stone(g,c.x+Math.cos(j*1.1)*42,c.y+Math.sin(j*1.1)*27,9);}
 const groves=[[240,320],[360,280],[420,340],[175,470],[240,640],[315,725],[490,700],[590,780],[695,695],[795,655],[810,360],[690,275],[560,300],[500,230],[380,820],[800,250]];
 groves.filter(([x,y])=>Math.hypot(x-OVERLORD.x,y-OVERLORD.y)>95).forEach(([x,y],i)=>{stone(g,x+15,y+26,24);tree(g,x-16,y,24);tree(g,x+15,y-18,29);tree(g,x+39,y+11,21);if(i%2)tree(g,x-37,y+23,19);});
 for(const [x,y] of [[220,270],[370,440],[560,630],[780,725],[520,385],[670,690]]){g.ellipse(x,y,37,17).fill(0x244e3b);for(let i=0;i<16;i++){const xx=x-32+i*4,yy=y+Math.sin(i*4)*9;g.moveTo(xx-4,yy+8).lineTo(xx,yy-12-i%3*4).lineTo(xx+4,yy+6).fill(i%2?0x719454:0x47764a);}}
 g.ellipse(OVERLORD.x,OVERLORD.y,73,55).fill(0x352e50).stroke({width:10,color:0x777985});g.ellipse(OVERLORD.x,OVERLORD.y,57,40).fill(0x4c4162);
 // Dragon pool with a broken circular stone wall, entered from river.
 g.ellipse(DRAGON.x,DRAGON.y,83,67).fill(0x153c48).stroke({width:12,color:0x6b7b75});g.ellipse(DRAGON.x,DRAGON.y,68,52).fill(0x24566a).stroke({width:2,color:0x87a7a1});
 for(let i=0;i<9;i++){const a=i*.55-1.6;stone(g,DRAGON.x+Math.cos(a)*83,DRAGON.y+Math.sin(a)*63,14);}
 for(const [team,b] of BASES.entries()){
  const color=teamColor(team);g.circle(b.x,b.y,90).fill(0x3c5754).stroke({color:0x94a297,width:5});g.circle(b.x,b.y,70).stroke({color,width:3,alpha:.4});g.circle(b.x,b.y,47).fill(0x283d43).stroke({color:0xa6a98b,width:5});
  for(let i=0;i<8;i++){const a=i*Math.PI/4;line(g,[{x:b.x+Math.cos(a)*51,y:b.y+Math.sin(a)*51},{x:b.x+Math.cos(a)*65,y:b.y+Math.sin(a)*65}],color,3,.5);}
 }
}
function drawTower(g:Graphics,x:number,y:number,team:number){
 const c=teamColor(team);g.ellipse(x+5,y+11,24,15).fill({color:0x0b252b,alpha:.6});g.ellipse(x,y+5,25,16).fill(0x5d7371).stroke({width:3,color:0xa4b5a2});
 g.poly([x-15,y+3,x-12,y-29,x+12,y-29,x+15,y+3]).fill(0x81958d).stroke({width:2,color:0x334a4c});g.poly([x,y+3,x,y-29,x+12,y-29,x+15,y+3]).fill(0x4f686b);
 g.poly([x-18,y-26,x-21,y-39,x-12,y-34,x,y-46,x+12,y-34,x+21,y-39,x+18,y-26]).fill(0xb6baa1).stroke({width:2,color:0x4e6864});
 g.circle(x,y-29,8).fill({color:c,alpha:.2});diamond(g,x,y-31,10,c);g.rect(x-19,y-55,38,4).fill(0x102d31);g.rect(x-18,y-54,36,2).fill(c);
}
function drawHero(g:Graphics,h:Hero,time:number){
 const c=teamColor(h.team);g.clear();
 if(h.hp<=0){g.ellipse(0,10,16,8).stroke({color:c,width:2,alpha:.4});return;}
 g.ellipse(0,17,23,10).stroke({color:c,width:2,alpha:.8});
 if(h.hp<22)g.ellipse(0,16,25,12).stroke({color:0xff8a80,width:2,alpha:.65});
 if(h.shield)g.ellipse(0,-8,29,35).stroke({color:0xc0f7ff,width:2,alpha:.7});
 g.roundRect(-23,-65,46,7,2).fill(0x102129);
 g.roundRect(-22,-64,44*h.hp/100,5,1).fill(h.hp<22?0xff7885:c);
}

function dragon(g:Graphics,w:World){
 const {x,y}=DRAGON,alive=w.dragon.hp>0;
 if(!alive){g.ellipse(x,y,45,23).stroke({color:teamColor(w.dragon.owner),width:3,alpha:.6});return;}
 g.roundRect(x-43,y-116,86,8,3).fill(0x172a38);g.roundRect(x-42,y-115,84*w.dragon.hp/100,6,2).fill(w.dragon.hp<25?0xffb16e:0xc392ea);
}
export async function createArena(el:HTMLDivElement,getWorld:()=>World,getDirector:()=>Director,view:'main'|'map'|'overview'='main',enabled:()=>boolean=()=>false){
 const app=new Application();await app.init({resizeTo:el,antialias:true,background:0x102b30,resolution:Math.min(3,Math.max(2,devicePixelRatio)),autoDensity:true});el.appendChild(app.canvas);
 const mini=view==='map';const resizeObserver=new ResizeObserver(()=>{app.resize();if(view==='main')getDirector().camera.setViewport(app.screen.width,app.screen.height);});resizeObserver.observe(el);
 const scene=new Container(),ground=new Graphics(),structures=new Graphics(),effects=new Graphics(),units=new Container(),overFX=new Graphics();
 scene.addChild(ground,structures,effects,overFX,units);app.stage.addChild(scene);terrain(ground);
 const atlas=await Assets.load<Texture>(HERO_ATLAS);
 atlas.source.autoGenerateMipmaps=true;atlas.source.scaleMode='linear';
 const heroTextures=HERO_ART.map(art=>new Texture({source:atlas.source,frame:new Rectangle(...art.frame)}));
 const avatars=getWorld().heroes.map((hero)=>{const c=new Container(),g=new Graphics(),name=new Text({text:'',style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:10,fill:0xf1f3de,stroke:{color:0x10252c,width:3}}});name.anchor.set(.5,0);name.y=24;const sprite=new Sprite(heroTextures[hero.artId]);sprite.anchor.set(.5,1);sprite.position.set(0,16);const ghost=new Sprite(heroTextures[hero.artId]);ghost.anchor.set(.5,1);ghost.visible=false;scene.addChildAt(ghost,4);c.addChild(sprite,g,name);units.addChild(c);return{c,g,name,sprite,ghost};});
 const monstersLayer=new Container();scene.addChildAt(monstersLayer,2);const updateMonsters=await createMonsters(monstersLayer,mini);
 const title=new Text({text:'',style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:22,fontWeight:'bold',fill:0xffdfa3,stroke:{color:0x142730,width:5},dropShadow:{color:0x000000,blur:6,distance:2,alpha:.5}}});title.anchor.set(.5);app.stage.addChild(title);
 const detail=new Text({text:'',style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:11,fill:0xf4e9ce,stroke:{color:0x142730,width:3}}});detail.anchor.set(.5);app.stage.addChild(detail);
 const dragonLabel=new Text({text:'远古暴君',style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:12,fill:0xe7c7fa,stroke:{color:0x122d3b,width:3}}});dragonLabel.anchor.set(.5);dragonLabel.position.set(DRAGON.x,DRAGON.y-130);scene.addChild(dragonLabel);
 const followMark=new Graphics();scene.addChild(followMark);
 const followLabel=new Text({text:'',style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:12,fontWeight:'bold',fill:0xffedb0,stroke:{color:0x18384a,width:4}}});followLabel.anchor.set(.5,1);scene.addChild(followLabel);
 const operator=new Text({text:'',style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:13,fontWeight:'bold',fill:GOLD,stroke:{color:0x12202b,width:4}}});operator.anchor.set(.5,1);scene.addChild(operator);
 let mapPing:{x:number;y:number;at:number}|null=null;
 let drag:{x:number;y:number;startX:number;startY:number;moving:boolean;pointer:number}|null=null,lastWheel=-1000;
 const toMap=(event:PointerEvent)=>{const r=el.getBoundingClientRect();return mapPoint(event.clientX-r.left,event.clientY-r.top,r.width,r.height);};
 const down=(event:PointerEvent)=>{if(drag||!enabled()||view==='overview'||event.button!==0)return;event.preventDefault();el.setPointerCapture(event.pointerId);drag={x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moving:false,pointer:event.pointerId};if(mini){const p=toMap(event);if(p){mapPing={...p,at:getWorld().time};getDirector().focus(p,getWorld().time);}}};
 const move=(event:PointerEvent)=>{if(!drag||drag.pointer!==event.pointerId||!enabled())return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(mini){const p=toMap(event);if(p){mapPing={...p,at:getWorld().time};getDirector().camera.focus(p);}}else if(drag.moving||Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>4){if(!drag.moving)getDirector().beginPan(getWorld().time);drag.moving=true;getDirector().camera.pan(dx,dy);}drag.x=event.clientX;drag.y=event.clientY;};
 const up=(event:PointerEvent)=>{if(drag?.pointer!==event.pointerId)return;if(el.hasPointerCapture(event.pointerId))el.releasePointerCapture(event.pointerId);drag=null;};
 const wheel=(event:WheelEvent)=>{if(!enabled()||view!=='main')return;event.preventDefault();if(event.timeStamp-lastWheel<180||!event.deltaY)return;lastWheel=event.timeStamp;const camera=getDirector().camera;camera.setZoom(camera.zoom+(event.deltaY>0?1:-1));};
 if(view!=='overview'){el.style.touchAction='none';el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('wheel',wheel,{passive:false});}
 app.ticker.add(()=>{
  const world=getWorld(),camera=getDirector().camera,width=app.screen.width,height=app.screen.height,overview=view!=='main';
  if(!overview)camera.setViewport(width,height);
  const frame=camera.frame(),scale=overview?Math.min(width,height)/1010:frame.scale;
  const recent=world.moments.filter(e=>e.done&&world.time-e.time<3).find(e=>contains(frame,eventPoint(e.kind,e.lane,e.winner),.06));
  scene.scale.set(scale);scene.position.set(width/2-(overview?500:frame.x+frame.width/2)*scale,height/2-(overview?500:frame.y+frame.height/2)*scale);
  structures.clear();effects.clear();overFX.clear();followMark.clear();followLabel.visible=false;
  for(const tower of TOWERS)drawTower(structures,tower.x,tower.y,tower.team);
  BASES.forEach((b,team)=>{const c=teamColor(team),alive=world.crystals[team]>0;structures.ellipse(b.x,b.y+14,29,14).fill(0x718b8e).stroke({width:3,color:0xc1c6a9});if(alive){structures.circle(b.x,b.y-10,38).fill({color:c,alpha:.08});diamond(structures,b.x,b.y-20+Math.sin(world.time*2)*3,34,c);structures.poly([b.x,b.y-54,b.x+22,b.y-20,b.x,b.y+14]).fill({color:0xffffff,alpha:.27});structures.circle(b.x,b.y+12,40).stroke({color:c,width:2,alpha:.5});}else for(let j=0;j<6;j++)diamond(structures,b.x+Math.cos(j)*24,b.y+Math.sin(j)*16,6,0x77818c);});
  updateMonsters(world);
  for(const c of CAMPS)structures.ellipse(c.x,c.y+10,18,8).fill({color:0x102e29,alpha:.4});
  
  dragon(structures,world);dragonLabel.text=world.dragon.hp>0?`远古暴君  ${Math.ceil(world.dragon.hp)}%`:`${world.dragon.owner?'红方':'蓝方'}${world.heroes.find(h=>h.id===world.dragon.killerId)?.name??''}拿下暴君 · ${Math.ceil(Math.max(0,world.dragon.respawn-world.time))}s`;dragonLabel.visible=!mini;
  // Moving minion waves follow the very same three paths shown on the tactical map.
  for(let l=0;l<3;l++)for(let team=0;team<2;team++)for(let j=0;j<4;j++){const travel=((world.time*.012+j*.018)%.45),p=routePoint(l,team?1-travel:travel);structures.ellipse(p.x,p.y+4,6,3).fill(0x173137);structures.roundRect(p.x-4,p.y-6,8,10,2).fill(teamColor(team));structures.circle(p.x,p.y-8,3).fill(0xded8bc);}
  const prominent=new Set(world.heroes.filter(h=>h.signature&&h.hp>0&&contains(frame,h)).sort((a,b)=>Number(b.id===camera.heroId)-Number(a.id===camera.heroId)||Math.hypot(a.x-camera.center.x,a.y-camera.center.y)-Math.hypot(b.x-camera.center.x,b.y-camera.center.y)).slice(0,3).map(h=>h.id));
  world.heroes.forEach((h,i)=>{
   const a=avatars[i];a.ghost.visible=false;a.c.position.set(h.x,h.y);a.sprite.texture=heroTextures[h.artId];a.sprite.visible=!mini;
   const artScale=76/Math.max(a.sprite.texture.width,a.sprite.texture.height);a.sprite.scale.set(artScale*h.facing,artScale);a.sprite.rotation=h.hp<=0?.9:h.dashing?h.facing*.16:h.attacking?Math.sin(h.cast*Math.PI*2)*.06:0;a.sprite.alpha=h.hp<=0?.25:1;a.sprite.y=16-(h.hp>0?Math.abs(Math.sin(world.time*9+h.id))*Math.min(2,Math.hypot(h.vx,h.vy)/60):0);a.c.zIndex=camera.heroId===h.id?2000:h.y;drawHero(a.g,h,world.time);a.name.text=h.recovery==='retreat'?'残血撤退':h.recovery==='recall'?`回城 ${Math.max(0,3-(world.time-h.recoveryAt)).toFixed(1)}s`:h.recovery==='fountain'?'泉水恢复 +25%/秒':h.hp<=0?'击败':h.shield?'护盾 · '+h.name:h.hp<22?'濒危 '+Math.ceil(h.hp)+'%':h.name.split('·')[0];a.name.style.fill=h.hp>0&&h.hp<22?0xff9d9d:0xf1f3de;a.name.visible=!mini&&width>350&&camera.heroId!==h.id;a.name.style.fontSize=9;a.c.scale.set(mini?1.5:camera.heroId===h.id?1.06:.92);
   if(mini){a.g.clear();a.g.circle(0,0,10).fill(h.hp<=0?0x43535c:teamColor(h.team)).stroke({color:0xecf9df,width:2});if(h.hp>0&&h.hp<22)a.g.circle(0,0,16).stroke({color:0xff3f5a,width:3});return;}
   if(h.recovery==='recall')effects.circle(h.x,h.y+12,25).stroke({color:0x80dcff,width:3,alpha:.8});if(h.recovery==='fountain')effects.circle(h.x,h.y,30).stroke({color:0x80ffaa,width:3,alpha:.7});
   if(h.signature&&h.hp>0){
    drawSignature(overFX,h.signature,world.time,camera.heroId===h.id,prominent.has(h.id));
    if(h.signature.kind==='mirror'&&prominent.has(h.id)){
     const s=h.signature;a.ghost.texture=a.sprite.texture;a.ghost.position.set(2*(s.x+s.dx*30)-h.x,2*(s.y+s.dy*30)-h.y+16);
     a.ghost.scale.set(-artScale*h.facing*.85,artScale*.85);a.ghost.tint=0xa4dcff;a.ghost.alpha=.28*Math.min(1,(1.25-world.time+s.at)/.25);a.ghost.visible=true;
    }
    return;
   }
   if(!h.attacking||h.hp<=0)return;
   const enemy=world.heroes.find(o=>o.id===h.targetId),active=world.activeMoments.find(e=>world.participates(h,e));
   const p=h.neutralId?world.neutrals.find(n=>n.id===h.neutralId&&n.hp>0):enemy;
   if(!p||Math.hypot(p.x-h.x,p.y-h.y)>310)return;
   if(h.signature?.kind==='fan')return; // The fan replaces generic mage bolts during this cast.
   const phase=h.cast,c=teamColor(h.team),dx=p.x-h.x,dy=p.y-h.y,angle=Math.atan2(dy,dx);
   // Anticipation, release, contact, recovery use one shared cast clock.
   if(phase<.22){effects.ellipse(h.x,h.y+15,23,12).stroke({color:c,width:2,alpha:phase/.22});}
   if(phase>=.22&&phase<.58){const f=(phase-.22)/.36,xx=h.x+dx*f,yy=h.y+dy*f-12;
    if(h.role===0||h.role===4){const reach=Math.min(100,Math.hypot(dx,dy));overFX.moveTo(h.x+Math.cos(angle-1+f)*reach,h.y-8+Math.sin(angle-1+f)*reach).arc(h.x,h.y-8,reach,angle-1+f,angle+.5+f).stroke({color:c,width:h.role===4?5:3,alpha:.7-f*.4});}
    else if(h.role===2){effects.circle(p.x,p.y,45).stroke({color:c,width:2,alpha:.3});for(let k=-1;k<=1;k++)overFX.ellipse(xx+Math.sin(angle)*k*10,yy-Math.cos(angle)*k*10,7,4).fill({color:c,alpha:.7});}
    else{line(overFX,[{x:xx-dx*.12,y:yy-dy*.12},{x:xx,y:yy}],c,3);diamond(overFX,xx,yy,6,0xfff4d1);}
   }
   if(phase>=.58&&phase<.75){const f=(phase-.58)/.17;overFX.circle(p.x,p.y-12,5+f*23).stroke({color:0xffe9bb,width:4*(1-f)+1,alpha:1-f});for(let k=0;k<4;k++){const angle=k*Math.PI/2;line(overFX,[{x:p.x+Math.cos(angle)*(8+f*12),y:p.y-12+Math.sin(angle)*(8+f*12)},{x:p.x+Math.cos(angle)*(15+f*25),y:p.y-12+Math.sin(angle)*(15+f*25)}],GOLD,2,1-f);}}

  });units.sortableChildren=true;
  operator.visible=false;
  for(const h of world.heroes){if(h.dashing&&!mini&&!h.signature){for(let j=1;j<=4;j++)overFX.ellipse(h.x-h.vx*.016*j,h.y-h.vy*.016*j,17,12).fill({color:teamColor(h.team),alpha:.24-j*.04});}}
  if(recent){const hero=world.keyHero(recent);operator.visible=!mini&&contains(frame,hero);operator.text=`★ ${hero.team?'红方':'蓝方'} ${hero.name.split('·')[0]} · ${isObjective(recent.kind)?(recent.stolen?'抢夺成功':'击杀目标'):recent.kind==='极限反杀'?'护盾反打':recent.kind==='团战四杀'?'四杀收割':'关键击杀'}`;operator.position.set(hero.x,hero.y-66);overFX.ellipse(hero.x,hero.y+15,29,16).stroke({color:GOLD,width:3,alpha:.9});
   const age=world.time-recent.time,p=eventPoint(recent.kind,recent.lane,recent.winner),c=teamColor(recent.winner??0);
   if(age<.24){overFX.circle(p.x,p.y,25+age*180).fill({color:0xfff4d0,alpha:(1-age/.24)*.35});}if(age<1.4){overFX.circle(p.x,p.y,20+age*90).stroke({color:c,width:5,alpha:1-age/1.4});for(let k=0;k<12;k++){const a=k*Math.PI/6;overFX.circle(p.x+Math.cos(a)*age*95,p.y+Math.sin(a)*age*65,3).fill({color:GOLD,alpha:1-age/1.4});}}
   if(isObjective(recent.kind)&&age<1){overFX.moveTo(p.x,p.y-160).lineTo(p.x,p.y).stroke({color:0xfff5b0,width:12*(1-age),alpha:1-age});overFX.circle(p.x,p.y,48+age*25).stroke({color:GOLD,width:4,alpha:1-age});}
  }
  const show=recent&&!overview;
  title.visible=!!show;detail.visible=!!show;title.position.set(width/2,height*.26);detail.position.set(width/2,height*.26+24);title.style.fontSize=width<400?13:25;detail.style.fontSize=width<400?8:11;
  if(show){title.text=recent.kind==='极限反杀'?'极限反杀 · 丝血逆转':isObjective(recent.kind)?((recent.stolen?'抢夺成功 · ':'击杀 · ')+(recent.kind==='主宰争夺'?'主宰':'暴君')):recent.kind==='团战四杀'?'QUADRA KILL · 团战四杀':recent.kind;title.style.fill=teamColor(recent.winner??0);detail.text=`${recent.winner?'红方':'蓝方'} ${world.keyHero(recent).name.split('·')[0]} · ${isObjective(recent.kind)?((recent.stolen?'最后一击抢到':'最后一击拿下')+(recent.kind==='主宰争夺'?'主宰':'暴君')):recent.kind==='极限反杀'?'护盾触发 · 追击者被击倒':'赢下这波交锋'}`;}
  if(mini&&mapPing&&world.time-mapPing.at<.8){overFX.circle(mapPing.x,mapPing.y,18+(world.time-mapPing.at)*30).stroke({color:GOLD,width:5,alpha:1-(world.time-mapPing.at)/.8});}
  if(overview){overFX.roundRect(frame.x,frame.y,frame.width,frame.height,6).stroke({color:0xe8eaa4,width:4,alpha:.85});}if(camera.heroId!==null){const hero=world.heroes.find(h=>h.id===camera.heroId);if(hero){
   followMark.ellipse(hero.x,hero.y+16,28,15).stroke({color:0x142d3b,width:6});followMark.ellipse(hero.x,hero.y+16,28,15).stroke({color:GOLD,width:3});
   if(!mini){followMark.poly([hero.x-7,hero.y-77,hero.x+7,hero.y-77,hero.x,hero.y-68]).fill(GOLD);followLabel.visible=true;followLabel.text=`跟拍 · ${hero.name.split('·')[0]}`;if(hero.signature&&world.time-hero.signature.at<.8)followLabel.text+=` · ${signatureName[hero.signature.kind]}`;followLabel.position.set(hero.x,hero.y-82);}
  }}
 });
 return()=>{resizeObserver.disconnect();el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('wheel',wheel);app.destroy(true,{children:true});};
}









