import { World } from '../game/engine';
import { regionAt } from '../game/map';
import { HeroPortrait } from './HeroPortrait';
export const TEAMS = [{ name:'青岚', code:'QING LAN', mark:'岚' },{ name:'赤焰', code:'CHI YAN', mark:'焰' }];
export const clock = (seconds:number) => `${Math.floor(Math.max(0,seconds)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,seconds)%60).toString().padStart(2,'0')}`;
export const exactGold = (n:number) => Math.floor(n).toLocaleString();
export const money = (n:number) => `${(n/1000).toFixed(1)}k`;
export function Scoreboard({world,series,round,demo}:{world:World;series:number[];round:number;demo:string}) {
 const gold=world.gold;
 return <section className="scoreboard" aria-label="赛事比分面板">
  <div className="scoreboard-main">
   <div className="team-identity blue"><div className="team-crest">岚</div><div><h1>青岚<span>QING LAN</span></h1><div className="series-pips">{[0,1].map(i=><i key={i} className={series[0]>i?'won':''}/>)}<small>蓝色方</small></div></div></div>
   <div className="series-score blue"><span>小局</span><strong>{series[0]}</strong></div>
   <div className="kill-score blue"><strong>{world.kills[0]}</strong><span>击杀</span></div>
   <div className="match-center"><span>{demo?'高光演练':`BO3 · 第 ${round} 局`}</span><strong>{clock(world.time)}</strong><small>{demo?'高光演练':'峡谷邀请赛 · 三局两胜'}</small></div>
   <div className="kill-score red"><strong>{world.kills[1]}</strong><span>击杀</span></div>
   <div className="series-score red"><span>小局</span><strong>{series[1]}</strong></div>
   <div className="team-identity red"><div className="team-crest">焰</div><div><h1>赤焰<span>CHI YAN</span></h1><div className="series-pips">{[0,1].map(i=><i key={i} className={series[1]>i?'won':''}/>)}<small>红色方</small></div></div></div>
  </div>
  <div className="economy-strip"><div className="blue"><span>◈ 总经济 <b>{exactGold(gold[0])}</b></span><span>♜ 暴君 <b>{world.dragons[0]}</b> / 主宰 <b>{world.overlords[0]}</b></span></div><div className="gold-advantage">{gold[0]===gold[1]?'经济持平':`${gold[0]>gold[1]?'青岚':'赤焰'}领先 +${exactGold(Math.abs(gold[0]-gold[1]))}`}</div><div className="red"><span>♜ 暴君 <b>{world.dragons[1]}</b> / 主宰 <b>{world.overlords[1]}</b></span><span>◈ 总经济 <b>{exactGold(gold[1])}</b></span></div></div>
  <div className="economy-balance"><i style={{width:`${gold[0]/(gold[0]+gold[1])*100}%`}}/></div>
 </section>;
}
export function Roster({world,team,selected,onFollow,disabled}:{world:World;team:number;selected:number|null;onFollow:(id:number)=>void;disabled:boolean}) {
 return <aside className={`roster ${team?'red-roster':'blue-roster'}`} aria-label={`${TEAMS[team].name}英雄状态`}>
  <div className="roster-heading"><span>{team?'RED TEAM':'BLUE TEAM'}</span><small>点头像跟拍</small></div>
  {world.heroes.filter(h=>h.team===team).map(h=><button type="button" disabled={disabled} onClick={()=>onFollow(h.id)} aria-label={`跟拍${team?'红方':'蓝方'}${h.name}`} aria-pressed={selected===h.id} className={`hero-row ${h.hp>0&&world.time-h.lastCombat<1?'in-combat':''} ${world.time-h.burstAt<.9?'damage-burst':''} ${selected===h.id?'following':''} ${h.hp<=0?'fallen':h.hp<22?'critical':''}`} key={h.id}>
   {h.hp>0&&world.time-h.lastCombat<1&&<span className="combat-badge" aria-label="正在交战">⚔</span>}
   {world.time-h.burstAt<.9&&<span className="damage-number" aria-label={`刚刚损失${h.burstLoss}%血量`}>−{h.burstLoss}%</span>}
   <div className="hero-portrait"><HeroPortrait hero={h}/>{h.hp<=0&&<b className="respawn">{Math.ceil(h.deadUntil-world.time)}</b>}<span className="role-tag">{['战','野','法','射','辅'][h.role]}</span></div>
   <div className="hero-info"><div className="hero-name"><b>{h.name.split('·')[0]}</b><small>{Math.ceil(h.hp)}%</small></div><div className="hero-hp" aria-label={`${h.name}血量${Math.ceil(h.hp)}%`}><i className="hp-trail" style={{width:`${h.trailHp}%`}}/><i className="hp-current" style={{width:`${h.hp}%`}}/></div><div className="hero-numbers"><span>{h.kills}<i>/</i>{h.deaths}<i>/</i>{h.assists}</span><small>{h.hp<=0?'复活中':h.shield?'护盾':money(h.gold)}</small></div><div className="hero-location">{world.recentIncome(h.id).length?`◈ +${world.recentIncome(h.id).reduce((sum,g)=>sum+g.amount,0)}`:h.recovery==='retreat'?'撤退中':h.recovery==='recall'?`回城 ${Math.max(0,3-(world.time-h.recoveryAt)).toFixed(1)}s`:h.recovery==='fountain'?'泉水恢复':regionAt(h)}{selected===h.id&&<span> ● 跟拍</span>}</div></div>
  </button>)}
 </aside>;
}



