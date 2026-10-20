# Q 版野怪素材

方式：内置 image_gen，transparent_background=true。最终图集：public/heroes/monsters-v2.png。PNG 为 RGBA；已读取 alpha 通道确认背景透明。运行时裁框，不修改原始像素。

## 初始提示词

Create ONE production sprite atlas for a chibi MOBA spectator game: transparent PNG, exactly 3 columns x 2 rows evenly spaced grid, no words, no border, no background, no shadows outside silhouettes. Each cell contains one complete isolated creature centered with at least 12% transparent padding on all sides, no overlap. Row 1: blue buff stone golem with cyan crystal crown; red buff stout crimson rock golem with orange molten core; small tan tusked jungle boar. Row 2: purple horned Overlord dragon with compact huge head and small wings; golden amber Tyrant dragon with dark bronze armor, horns, compact wings; turquoise small river lizard. All six are cute but powerful Q-version fantasy jungle monsters, three-quarter slightly top down game perspective, clean bold dark outline, broad flat cel shading, very few tiny details, extremely readable when rendered 50-100 pixels tall, coherent polished mobile game asset style. All feet and wings fully inside each cell. Crisp opaque body colors and genuinely transparent surrounding background.

## 透明边缘与布局修订提示词

Edit this monster atlas into a USABLE TRANSPARENT sprite sheet. REMOVE ALL dark colored background and ALL colored glow halos entirely. The pixels outside the six creature silhouettes must be truly alpha=0, NOT black or dark gradient. Preserve the six creature designs. Rearrange into EXACT 3 columns and 2 rows equal cells. SCALE DOWN each creature so there is a generous TRANSPARENT 15% margin on all four edges of its cell. No creature may touch another cell. No labels, no ground, no shadow. Crisp clean contours, thick outline, broad cel shading. Return transparent PNG with alpha channel.

主宰目前仅作为地图形象展示；暴君保留原有血量、抢夺和重生状态。蓝红 Buff、野猪和河道小怪沿用原场景装饰范围，尚未新增刷野经济或中立怪物 AI。
