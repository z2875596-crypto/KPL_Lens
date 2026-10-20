export type Activity = { lastCombat:number; burstAt:number; burstLoss:number; damageWindow:{at:number;loss:number}[] };
export const newActivity=():Activity=>({lastCombat:-100,burstAt:-100,burstLoss:0,damageWindow:[]});
/** Observed HP deltas and actual attack phases only; no event schedule input. */
export function observeActivity(a:Activity,time:number,before:number,after:number,released:boolean){
 const loss=Math.max(0,before-after);
 if(loss>.01||released)a.lastCombat=time;
 a.damageWindow=a.damageWindow.filter(d=>time-d.at<=.8);
 if(loss>.01)a.damageWindow.push({at:time,loss});
 const total=a.damageWindow.reduce((sum,d)=>sum+d.loss,0);
 if(total>=18&&time-a.burstAt>=1.6){a.burstAt=time;a.burstLoss=Math.round(total);a.damageWindow=[];}
}
