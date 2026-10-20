import { type Director, type World } from '../game/engine';
import { GRADE_LABEL } from '../game/director';
import { clock, exactGold, TEAMS } from './BroadcastHUD';
import { regionAt } from '../game/map';
import { HeroPortrait } from './HeroPortrait';
export function Danmaku({director,time,enabled,replayOnly=false}:{director:Director;time:number;enabled:boolean;replayOnly?:boolean}){
 if(!enabled)return null;
 return <div className="danmaku-layer" aria-label="观众弹幕">{director.chat.filter(m=>m.at<=time&&time-m.at<7.2&&(!replayOnly||m.replay)).map(m=>{const progress=(time-m.at)/7.2;return <span key={m.id} className={`danmaku ${m.tone}`} style={{top:m.row*22,left:`${100-progress*100}%`,transform:`translateX(-${progress*100}%)`}}>{m.text}</span>;})}</div>;
}
export function Economy({world,onClose,onFollow,canFollow=true}:{canFollow?:boolean;world:World;onClose:()=>void;onFollow:(id:number)=>void}){
 return <div className="economy-panel"><div className="economy-panel-head"><b>十人状态与经济</b><span>{canFollow?'累计所得 · 点击跟拍':'累计所得 · 当前仅查看'}</span><button onClick={onClose}>收起 ×</button></div><div className="economy-teams">{[0,1].map(team=><section key={team}><h3 className={team?'red':'blue'}>{TEAMS[team].name} <small>总经济 {exactGold(world.gold[team])}</small></h3>{world.heroes.filter(h=>h.team===team).map(h=><button className={`economy-row ${world.recentIncome(h.id).length?'income-active':''}`} key={h.id} aria-disabled={!canFollow} onClick={()=>canFollow&&onFollow(h.id)} aria-label={`经济面板跟拍${team?'红方':'蓝方'}${h.name}`}><HeroPortrait hero={h}/><span><b>{h.name.split('·')[0]}</b><small>{regionAt(h)}</small></span><span className="eco-hp">{Math.ceil(h.hp)}%<i style={{background:`linear-gradient(90deg,${team?'#e98d9f':'#71cdd7'} ${h.hp}%,#203447 ${h.hp}%)`}}/></span><span className="eco-kda">{h.kills}/{h.deaths}/{h.assists}</span><strong>{Math.floor(h.gold).toLocaleString()}<small className="income-label">{world.recentIncome(h.id).length?`+${world.recentIncome(h.id).reduce((sum,g)=>sum+g.amount,0)} ${[...new Set(world.recentIncome(h.id).map(g=>g.source.startsWith('击杀')?'击杀':g.source.startsWith('助攻')?'助攻':g.source))].join(' / ')}`:'金币'}</small></strong></button>)}</section>)}</div></div>;
}
export function Review({director}:{director:Director}){
 const best=director.records.filter(r=>['complete','effective'].includes(r.grade)).sort((a,b)=>b.gain-a.gain)[0];
 const improvement=director.records.filter(r=>['missed','late'].includes(r.grade)).sort((a,b)=>b.event.points-a.event.points)[0];
 const fair=director.records.find(r=>r.grade==='waived');
 const picks=[best,improvement,fair].filter((r):r is NonNullable<typeof r>=>!!r);
 return <div className="review"><h3>本场镜头复盘</h3>{picks.length?picks.map((r,i)=><article key={i} className={r.grade}><div><time>{clock(r.event.time)}</time><b>{r.event.kind}</b><span>{GRADE_LABEL[r.grade]}</span></div><p>{r.note}{r.replayGain?` 回放补救 +${r.replayGain}（仅一次，保留漏拍记录）`:null}</p></article>):<p>本场没有完成可评估的精彩事件。</p>}<details><summary>查看全部 {director.records.length} 个事件</summary>{director.records.map((r,i)=><p key={i}>{clock(r.event.time)} · {r.event.kind} · {GRADE_LABEL[r.grade]} · {r.gain>0?'+':''}{r.gain} 分</p>)}</details></div>;
}
