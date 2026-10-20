import { Replay } from './game/replay';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { World, Director, LANES, STEP } from './game/engine';
import { createArena } from './game/render';
import { Scoreboard, Roster, TEAMS, clock } from './components/BroadcastHUD';
import { ZOOMS } from './game/camera';
import { DRAGON, FRONTS, regionAt, eventPoint } from './game/map';
import { Danmaku, Economy, Review } from './components/DirectorTools';
import './style.css';

const session = { world:new World(), director:new Director(), running:false, replay:new Replay() };
type Mode = 'ready'|'play'|'pause'|'results';
function Arena({view='main'}:{view?:'main'|'map'|'overview'}) {
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  let cancelled=false,dispose:(()=>void)|undefined;
  createArena(ref.current!,()=>view==='main'&&session.replay.active?session.replay.world:session.world,()=>view==='main'&&session.replay.active?session.replay.director:session.director,view,()=>session.running&&(view==='main'||!session.replay.active)).then(d=>{if(cancelled)d();else dispose=d;});
  return()=>{cancelled=true;dispose?.();};
 },[view]);
 return <div className={`arena arena-${view}`} ref={ref} aria-label={view==='main'?'主画面：拖动平移，滚轮缩放':view==='map'?'点击小地图定位镜头':'峡谷全图'}/>;
}
function App() {
 const [mode,setMode]=useState<Mode>('ready'),[,render]=useState(0);
 const [replayMenu,setReplayMenu]=useState(false);
 const [help,setHelp]=useState(false),[sound,setSound]=useState(false),[mapOpen,setMapOpen]=useState(false),[demo,setDemo]=useState(''),[danmaku,setDanmaku]=useState(true),[economyOpen,setEconomyOpen]=useState(false);
 const [series,setSeries]=useState([0,0]),[round,setRound]=useState(1),[winner,setWinner]=useState<number|null>(null);
 const audio=useRef<AudioContext|null>(null),w=session.world,d=session.director,duration=demo?22:180;
 const replay=session.replay,viewWorld=replay.active?replay.world:w,viewDirector=replay.active?replay.director:d;
 const cut=(lane:number)=>{if(!session.running)return;viewDirector.switch(lane,viewWorld.time);render(v=>v+1);};
 const follow=(id:number)=>{if(!session.running)return;viewDirector.follow(id,viewWorld);setEconomyOpen(false);render(v=>v+1);};
 const zoom=(index:number)=>{if(!session.running)return;viewDirector.camera.setZoom(index);render(v=>v+1);};
 const pause=()=>{if(mode==='play'){session.running=false;setMode('pause');}else if(mode==='pause'){session.running=true;setMode('play');}};
 const showHelp=()=>{if(session.running){session.running=false;setMode('pause');}setHelp(true);};
 function menu() {session.running=false;session.world=new World();session.director=new Director();session.replay=new Replay();setReplayMenu(false);setDemo('');setEconomyOpen(false);setMode('ready');}
 function start(kind='') {
  session.world=new World();session.director=new Director();session.replay=new Replay();setReplayMenu(false);setDemo(kind);setWinner(null);setEconomyOpen(false);
  if(!kind){if(series.some(s=>s>=2)){setSeries([0,0]);setRound(1);}else setRound(series[0]+series[1]+1);}
    else if(kind==='双线取舍')session.world.moments=[{time:12,lane:1,kind:'关键抢龙',points:400,done:false,winner:0,actors:[1,2,3,4,6,7,8,9]},{time:12,lane:0,kind:'单点击杀',points:100,done:false,winner:1,actors:[0,5]}];
  else session.world.moments=[{time:12,lane:1,kind,points:kind==='团战四杀'?500:['关键抢龙','主宰争夺'].includes(kind)?400:300,done:false,winner:0}];
  session.running=true;setMode('play');
 }
 useEffect(()=>{
  let previous=performance.now(),bank=0,frame=0;
  const tick=(now:number)=>{
   const delta=Math.min(.15,(now-previous)/1000);previous=now;
   if(session.running){
    bank+=delta;
    while(bank>=STEP&&session.world.time<duration){
     session.world.step();session.replay.record(session.world);const wasReplay=session.replay.active;session.replay.step(STEP,session.world,session.director);session.director.camera.step(session.world,STEP);
     for(const result of session.director.observe(session.world,!wasReplay)){
      if(sound&&audio.current&&result.grade!=='waived'){const osc=audio.current.createOscillator(),gain=audio.current.createGain();osc.connect(gain);gain.connect(audio.current.destination);osc.frequency.value=result.gain>0?740:220;gain.gain.setValueAtTime(.04,audio.current.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.current.currentTime+.15);osc.start();osc.stop(audio.current.currentTime+.16);}
     }
     bank-=STEP;
    }
    if(session.world.time>=duration){
     session.running=false;session.replay.stop();setReplayMenu(false);
     if(!demo){const win=session.world.matchWinner;setWinner(win);setSeries(s=>s.map((n,i)=>n+(i===win?1:0)));}
     setMode('results');
    }
    render(v=>v+1);
   }
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[sound,duration,demo]);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(help||mapOpen)return;if((e.target as HTMLElement).tagName==='BUTTON'&&e.code==='Space')return;if(['1','2','3'].includes(e.key))cut(Number(e.key)-1);if(e.key==='+'||e.key==='=')zoom(viewDirector.camera.zoom-1);if(e.key==='-')zoom(d.camera.zoom+1);if(e.key.toLowerCase()==='e')setEconomyOpen(open=>!open);if(e.key.toLowerCase()==='b')setDanmaku(on=>!on);if(e.key.startsWith('Arrow')&&session.running){e.preventDefault();const delta=40;viewDirector.camera.pan(e.key==='ArrowLeft'?delta:e.key==='ArrowRight'?-delta:0,e.key==='ArrowUp'?delta:e.key==='ArrowDown'?-delta:0);}if(e.code==='Space'){e.preventDefault();pause();}};
  const hidden=()=>{if(document.hidden&&session.running){session.running=false;setMode('pause');}};
  window.addEventListener('keydown',key);document.addEventListener('visibilitychange',hidden);
  return()=>{window.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',hidden);};
 });
 const count=w.moments.filter(e=>e.done).length,rate=d.rate,grade=rate>=85?'S':rate>=65?'A':rate>=40?'B':'C';
 const selected=viewWorld.heroes.find(h=>h.id===viewDirector.camera.heroId);const cameraLabel=selected?`跟拍 · ${selected.team?'红方':'蓝方'}${selected.name.split('·')[0]}`:`自由镜头 · ${regionAt(viewDirector.camera.center)}`;
 const phase=demo?'高光演练':w.time>=150?'决胜时刻':w.time>=120?'后期决胜':w.time>=60?'中期节奏':'前期对线';
 function download() {
  const c=document.createElement('canvas');c.width=900;c.height=1200;const g=c.getContext('2d')!;
  g.fillStyle='#101c2a';g.fillRect(0,0,900,1200);g.strokeStyle='#d9bb7e';g.lineWidth=3;g.strokeRect(48,48,804,1104);
  g.fillStyle='#d9bb7e';g.font='bold 32px sans-serif';g.fillText(demo?'KPL 导播挑战 / 高光演练':'KPL 导播挑战 / DIRECTOR CHALLENGE',85,140);g.font='bold 210px sans-serif';g.fillText(grade,85,390);
  g.fillStyle='#ffffff';g.font='bold 62px sans-serif';g.fillText(grade==='S'?'金牌导播':'下一场，捕捉更多高光',85,520);g.font='42px sans-serif';
  [`本场得分  ${d.score}`,`镜头完成度  ${rate}%`,`最高 COMBO  ${d.bestCombo}`,`重大事故  ${d.accidents}`].forEach((s,i)=>g.fillText(s,85,650+i*85));
  g.font='26px sans-serif';g.fillStyle='#aebfbb';g.fillText('你的镜头，决定高光。下一位金牌导播是你吗？',85,1080);
  const a=document.createElement('a');a.download='KPL-导播成绩.png';a.href=c.toDataURL('image/png');a.click();
 }
 return <main className="broadcast-app">
  <header className="broadcast-header"><a href="#" className="broadcast-brand"><span className="brand-emblem">K</span><b>KPL <span>导播挑战</span></b><small>Q 版峡谷邀请赛</small></a><div className="header-center"><i className="live-dot"/> 峡谷放映室 <span>你的镜头，决定高光</span></div><div className="header-actions"><button onClick={showHelp}>操作指南</button><button disabled={mode!=='play'||replay.frames.length<60} aria-pressed={replay.active||replayMenu} onClick={()=>{if(replay.active)replay.stop();else setReplayMenu(open=>!open);}}>{replay.active?'返回直播':'回放'}</button><button aria-pressed={danmaku} onClick={()=>setDanmaku(on=>!on)}>{danmaku?'弹幕开':'弹幕关'}</button><button aria-pressed={economyOpen} onClick={()=>setEconomyOpen(open=>!open)}>经济 E</button><button aria-pressed={sound} title="导播评分提示音" onClick={()=>{setSound(!sound);if(!audio.current)audio.current=new AudioContext();void audio.current.resume();}}>{sound?'♪ 提示音开':'♪ 提示音关'}</button><button disabled={mode==='ready'||mode==='results'} onClick={pause}>{mode==='pause'?'▶ 继续':'Ⅱ 暂停'}</button></div></header>
  <Scoreboard world={w} series={series} round={round} demo={demo}/>
  <section className="battle-stage" aria-label="比赛直播主画面">
   <div className="main-arena"><Arena/></div>
   {(replayMenu||replay.active)&&<div className="replay-controls">{replay.active?<><b>回放中 · 直播仍在进行</b><span>剩余 {Math.ceil(replay.end-replay.cursor)} 秒 · 顶部比分及小地图为实时</span><button onClick={()=>replay.stop()}>返回直播 ×</button></>:<><b>补播最近画面</b>{[5,8].map(seconds=><button key={seconds} onClick={()=>{if(replay.start(seconds)){replay.director.camera.focus({...d.camera.center});setReplayMenu(false);}}}>最近 {seconds} 秒</button>)}{w.moments.filter(e=>e.done&&w.time-e.time<8).slice(-2).map((e,i)=><button key={i} onClick={()=>{if(replay.start(Math.min(11,w.time-e.time+3))){replay.director.camera.focus(eventPoint(e.kind,e.lane,e.winner));setReplayMenu(false);}}}>{clock(e.time)} {e.kind}</button>)}<button onClick={()=>setReplayMenu(false)}>收起 ×</button><small>沿用当前取景位置，可拖动回放画面；直播继续，回放不算直播捕捉，漏拍补清可获一次少量补救分。</small></>}</div>}<div className="battle-vignette"/>
   <div className="broadcast-bug"><span className="live-pill">{replay.active?'↶ 回放 '+clock(replay.cursor):'● LIVE'}</span><b>{cameraLabel}</b><small>{ZOOMS[viewDirector.camera.zoom].name}</small></div>
   <div className="phase-bug"><span>{phase}</span><b>剩余 {clock(duration-w.time)}</b></div>
   <Roster world={w} team={0} selected={d.camera.heroId} onFollow={follow} disabled={mode!=='play'||replay.active}/><Roster world={w} team={1} selected={d.camera.heroId} onFollow={follow} disabled={mode!=='play'||replay.active}/>

   <div className="match-feed"><div className="feed-title">赛事动态 <span>MATCH FEED</span></div>{w.moments.filter(e=>e.done).slice(-3).reverse().map(e=><div className={`feed-item ${e.winner?'red':'blue'}`} key={w.moments.indexOf(e)}><time>{clock(e.time)}</time><span>{TEAMS[e.winner??0].name}<b>{e.kind}</b></span></div>)}{!count&&<p>双方已进入峡谷<br/>等待第一波交锋</p>}</div>
   <Danmaku director={d} time={w.time} enabled={danmaku} replayOnly={replay.active}/>

   <div className="camera-crosshair" aria-hidden="true"><i/><i/><i/><i/></div>
   <div className="live-feedback" aria-live="polite"><span>OB</span>{d.feedback}</div>
  </section>
  <section className="director-dock" aria-label="导播控制面板">   <div className="tactical-map"><div className="map-title"><span>峡谷定位 · 点按 / 拖动</span><button aria-label="展开地图" onClick={()=>{if(session.running){session.running=false;setMode('pause');}setMapOpen(true);}}>⛶</button></div><div className="map-canvas"><Arena view="map"/></div></div><div className="camera-console"><div className="dock-title"><b>镜头控制</b><small>头像跟拍 · 地图定位 · 拖动自由移镜</small></div><div className="camera-controls"><div className="zoom-controls" role="group" aria-label="镜头景别">{ZOOMS.map((z,i)=><button key={z.name} disabled={mode!=='play'} aria-pressed={viewDirector.camera.zoom===i} onClick={()=>zoom(i)}><span>{['＋','◉','－'][i]}</span>{z.name}</button>)}</div><div className="lane-shortcuts" role="group" aria-label="区域快捷定位">{LANES.map((name,lane)=><button key={lane} disabled={mode!=='play'} onClick={()=>cut(lane)}><kbd>{lane+1}</kbd>{name.split(' ·')[0]}</button>)}<button disabled={mode!=='play'} onClick={()=>viewDirector.focus(DRAGON,viewWorld.time)}>♜ 龙坑</button></div></div><div className="camera-status"><span>{cameraLabel}</span><small>{d.camera.notice}</small></div></div>
   <div className="director-stats"><div className="dock-title"><b>我的导播表现</b><small>DIRECTOR</small></div><div className="director-numbers"><div><small>导播得分</small><strong>{d.score.toLocaleString().padStart(4,'0')}</strong></div><div><small>连续捕捉</small><b>{d.combo}<em> COMBO</em></b></div><div><small>镜头完成度</small><b>{rate}<em>%</em></b></div></div><div className="heat"><span>直播热度</span><div className="heat-track"><i style={{width:`${d.heat}%`}}/></div><b>{d.heat}</b></div></div>
   <div className="audience"><div className="dock-title"><b>观众席</b><small><i className="live-dot"/> LIVE CHAT</small></div><p><span>峡谷观察员</span>{d.chat.filter(m=>m.at<=w.time).at(-1)?.text||'已就位，今天谁是金牌导播？'}</p><div className="watch-tip">观察血量变化和位置<br/><b>提前入镜，留住交锋和结果。</b></div></div>
  </section>
  {economyOpen&&<div className="economy-surface"><Economy world={w} canFollow={mode==='play'&&!replay.active} onClose={()=>setEconomyOpen(false)} onFollow={follow}/></div>}
  <footer className="broadcast-footer"><span><i className="live-dot"/> Q 版赛事直播 · AI 绘制同人形象 / 非官方粉丝作品</span><span>滚轮 / ± 切景别 <i>·</i> E 经济 <i>·</i> B 弹幕 <i>·</i> <kbd>Space</kbd> 暂停</span></footer>
  {(mode!=='play'||help)&&<div className={`overlay ${mode==='ready'&&!help?'ready-screen':''}`}><section className="dialog">
   {help?<><div className="eyebrow">DIRECTOR HANDBOOK</div><h2>读懂比分，也读懂战场。</h2><p>顶部两侧“小局”是 BO3 系列赛胜场，中间的大数字是本局击杀数。经济来自持续收入、击杀、助攻、野怪和双龙奖励（本作采用简化数值，无装备消费）；两侧英雄栏同步显示血量、经济、所在区域与复活倒计时，详细 KDA 可在经济面板查看。</p><p>点击两侧英雄跟拍，点击小地图看区域；拖动画面或按方向键进入自由镜头。跟拍英雄阵亡后镜头留在现场。1/2/3 是三路快捷定位，龙坑需自己点选；滚轮、± 或按钮切换近景/标准/广角，切目标保留景别。</p><p>完整捕捉需要提前至少 1.2 秒持续观察、拍到关键交锋并留住结果；仅拍到交锋算有效捕捉，晚到只给部分分数。评分按实际入镜人物和范围判断，广角拍小规模交锋会降低细节奖励。同期拍到更重要的事件，可免除较小事件漏拍惩罚。镜头完成度按完整 100%、有效 80%、补到结果 30%、漏拍 0% 取平均，合理取舍不计入。</p><p>弹幕只在事件后出现，可按 B 关闭；E 打开经济面板，游戏继续运行。浅色血条是最近损失的血量。空格暂停，切出页面自动暂停。</p><p>正常对局结束后，优先按水晶结果判定胜方，否则比较经济；胜方获得一个小局胜场，先到 2 分赢下系列赛。演练不计入小局比分。</p><button className="primary" onClick={()=>setHelp(false)}>明白了</button></>
   :mode==='results'?<><div className="eyebrow">{demo?'PRACTICE COMPLETE / 演练结束':series.some(n=>n>=2)?'SERIES COMPLETE / 系列赛结束':'GAME COMPLETE / 本局结束'}</div>{winner!==null&&<div className={`match-result ${winner?'red':'blue'}`}><b>{TEAMS[winner].name} {series[winner]>=2?'赢下系列赛':'赢下本局'}</b><strong>{series[0]} <small>:</small> {series[1]}</strong><span>BO3 小局比分</span></div>}<div className="result-heading"><span className="grade">{grade}</span><div><h2>{grade==='S'?'金牌导播，收工！':'下一场，捕捉更多高光。'}</h2><p>本场导播成绩</p></div></div><div className="results-grid"><div>得分<b>{d.score}</b></div><div>镜头完成度<b>{rate}%</b></div><div>最高连击<b>{d.bestCombo}</b></div><div>重大事故<b>{d.accidents}</b></div></div><Review director={d}/><div className="actions"><button className="primary" onClick={()=>start()}>{demo?'进入正式比赛':series.some(n=>n>=2)?'开启新系列赛':'导播下一局'} →</button><button onClick={download}>保存成绩卡</button><button onClick={menu}>返回菜单</button></div></>
   :mode==='pause'?<><div className="eyebrow">BROADCAST PAUSED</div><h2>比赛暂停，镜头为你保留。</h2><p>当前人头 {w.kills[0]} : {w.kills[1]} · 小局 {series[0]} : {series[1]}</p><button className="primary" onClick={()=>{session.running=true;setMode('play');}}>继续导播 →</button><button className="text-btn" onClick={menu}>返回菜单 / 选择演练</button></>
   :<><div className="eyebrow">YOU ARE THE DIRECTOR</div><h2>这一场，由你掌镜。</h2><p>180 秒，把峡谷高光交给观众。<br/>点头像跟拍，拖动移镜，缩放呈现高光。</p><button className="primary start-button" onClick={()=>start()}>{series.some(n=>n>=2)?'开启新系列赛':'就位，开始导播'} →</button><div className="demo-options"><small>22 秒高光演练</small><div><button onClick={()=>start('团战四杀')}>⚔ 团战</button><button onClick={()=>start('极限反杀')}>◇ 残血反杀</button><button onClick={()=>start('关键抢龙')}>♜ 暴君</button><button onClick={()=>start('主宰争夺')}>♜ 主宰</button><button onClick={()=>start('双线取舍')}>⇄ 双线取舍</button></div></div></>}
  </section></div>}
  {mapOpen&&<div className="map-overlay"><section className="map-dialog"><div className="map-dialog-head"><b>峡谷全图 · 同步战场</b><button onClick={()=>setMapOpen(false)}>关闭 ×</button></div><div className="full-map"><Arena view="overview"/></div><p>三路线 · 河道 · 野区 · 龙坑 · 双方防御塔与水晶</p></section></div>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
