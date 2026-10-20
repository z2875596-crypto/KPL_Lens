export const HERO_ATLAS='./heroes/chibi-atlas-v1.png';
// Frame coordinates crop the generated atlas at runtime; original pixels stay intact.
export const HERO_ART=[
 {name:'镜',frame:[0,0,375,378],face:[150,100,130,125]},
 {name:'公孙离',frame:[375,0,363,378],face:[500,120,155,145]},
 {name:'女娲',frame:[738,0,365,378],face:[835,90,160,155]},
 {name:'司空震',frame:[1103,0,345,378],face:[1200,70,165,145]},
 {name:'苏烈',frame:[0,378,375,342],face:[100,425,170,160]},
 {name:'关羽',frame:[375,378,363,342],face:[430,405,160,160]},
 {name:'赵云',frame:[738,378,365,342],face:[860,425,160,155]},
 {name:'蒙恬',frame:[1103,378,345,342],face:[1200,430,155,160]},
 {name:'敖隐',frame:[0,720,385,366],face:[100,770,175,165]},
 {name:'钟馗',frame:[385,720,353,366],face:[485,735,175,170]},
 {name:'小乔',frame:[738,720,365,366],face:[860,785,160,160]},
] as const;
export function heroLineups(seed:number){return [[seed%2===0?3:7,0,2,1,4],[5,6,10,8,9]];}
