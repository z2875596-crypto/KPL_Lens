import {Assets,Container,Graphics,Rectangle,Sprite,Texture,Text} from 'pixi.js';
import {CAMPS,DRAGON,OVERLORD} from './map';
import type {World} from './engine';
export const MONSTER_ATLAS='/heroes/monsters-v2.png';
export async function createMonsters(layer:Container,mini:boolean){
 const atlas=await Assets.load<Texture>(MONSTER_ATLAS);
 atlas.source.autoGenerateMipmaps=true;atlas.source.scaleMode='linear';
 // Generated silhouettes have unequal widths; crop in clear alpha gaps, not through wings.
 const frames=[[0,0,548,490],[548,0,542,490],[1090,0,446,490],[0,490,548,534],[548,490,542,534],[1090,490,446,534]];
 const textures=frames.map(frame=>new Texture({source:atlas.source,frame:new Rectangle(...frame)}));
 const entries=[...CAMPS.map(c=>({...c,art:c.kind,size:68})),{...OVERLORD,art:3,size:133},{...DRAGON,art:4,size:136},{x:505,y:420,art:5,size:47}];
 const sprites=entries.map(e=>{const s=new Sprite(textures[e.art]);s.anchor.set(.5,.83);s.scale.set(e.size/Math.max(s.texture.width,s.texture.height));s.position.set(e.x,e.y);s.visible=!mini;layer.addChild(s);return s;});
 const bars=new Graphics();layer.addChild(bars);
 const label=new Text({text:'主宰',style:{fontFamily:'Microsoft YaHei',fontSize:12,fill:0xe4c2ff,stroke:{color:0x142a30,width:3}}});label.anchor.set(.5);label.position.set(OVERLORD.x,OVERLORD.y-128);label.visible=!mini;layer.addChild(label);
 return (world:World)=>{
  bars.clear();label.text=world.overlord.hp>0?`主宰 ${Math.ceil(world.overlord.hp)}%`:`${world.overlord.owner?'红方':'蓝方'}${world.heroes.find(h=>h.id===world.overlord.killerId)?.name??''}拿下主宰 · ${Math.ceil(Math.max(0,world.overlord.respawn-world.time))}s`;
  sprites.forEach((s,i)=>{const e=entries[i],n=world.neutrals.find(n=>n.x===e.x&&n.y===e.y)!;s.visible=!mini&&n.hp>0;s.y=e.y+Math.sin(world.time*2+i)*1.3;s.rotation=world.time-n.lastHit<.15?Math.sin(world.time*45)*.04:0;
   s.tint=world.time-n.lastHit<.1?0xffd3bf:0xffffff;
   if(!mini&&n.id!=='tyrant'&&(n.boss||n.hp<100)&&n.hp>0){const w=n.boss?74:36,y=n.y-(n.boss?112:56);bars.roundRect(n.x-w/2,y,w,5,2).fill(0x142933);bars.rect(n.x-w/2+1,y+1,(w-2)*n.hp/100,3).fill(n.boss?0xc19ae8:0xe4c989);}
   if(mini&&n.hp>0)bars.circle(n.x,n.y,n.boss?13:6).fill(n.boss?(n.id==='overlord'?0xb98be0:0xf1c56b):0xd6bd8e);
  });
 };
}

