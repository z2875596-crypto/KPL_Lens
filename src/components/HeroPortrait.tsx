import type { Hero } from '../game/engine';
import { HERO_ART,HERO_ATLAS } from '../game/heroArt';
export function HeroPortrait({hero}:{hero:Hero}) {
 const face=HERO_ART[hero.artId].face;
 return <svg viewBox={face.join(' ')} role="img" aria-label={hero.name} preserveAspectRatio="xMidYMid slice"><image href={HERO_ATLAS} width="1448" height="1086"/></svg>;
}
