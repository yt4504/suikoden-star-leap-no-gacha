// One-time source mapping. Keep exact version names here to avoid assigning a gacha costume.
import {readFile, writeFile} from 'node:fs/promises';
import {characters} from '../characters.mjs';

const target = {
  hero:'主人公 未確定',
  hisui:'ヒスイ 屋敷の使用人',
  shirin:'シーリーン 幼馴染の討伐娘',
  shapur:'シャプール 里長の右腕',
  viki:'ビッキー 瞬きの魔法少女',
  mauser:'マウサー 勇敢ナイトバニー',
  marie:'マリエ 宿屋の看板娘',
  yua:'ユア 情熱の料理っ娘',
  chloe:'クロエ 麗しの道具屋',
  flanagan:'フラナガン 頑丈な守衛',
  belladonna:'ベラドンナ 合理の建築士',
  orhan:'オルハン 常酔の店主',
  fara:'ファラ 快活な交易商',
  standard:'スタンダール 自称 当代随一の作家',
  haruka:'ハルカ 実りの導き手',
  ukuu:'ウクー 里の釣り少年',
  baubau:'バウバウ 元傭兵の木こり',
  rei:'レイ 知見求む貴族乙女',
  pros:'プロス 鋼鉄のからくり',
  rien:'リィエン 財宝求む貴族青年',
  meshu:'メーシュ 小さな巨匠',
  safia:'サフィア 報恩の狩人',
  hero_soldier:'主人公 欺装の帝国兵',
  nije:'ニージェ 凄腕の紋章師',
  madeleine:'マドレーヌ 奇抜な細工師',
  avery:'エイヴェリー 美の探求者',
  mare:'マーレ 万事億劫な人魚',
  miuser:'ミウサー 慈愛プリーストバニー',
  gonoh:'ゴンオウ 数百歳の少女',
  hero_school:'主人公 学園の英傑',
  diana:'ディアナ 強きを追う鬼人',
  vigdis:'ヴィグディス 海に聴こえし女船長',
  sojiro:'ソウジロウ 名うての操舵手',
  enra:'エンラ 敏腕ドワーフ技師',
  peter:'ペーター 博識の元教師',
  yume:'ユメ 夢見せの少女',
  ruarl:'ルアール 塔の守り人',
  hero_senkyo:'主人公 仙郷の英雄',
  hou_story:'ホウ 奔放な父',
  veil:'ヴェイル 獣心の紋章使い',
  bubu:'ブブ お師母様第一',
  tsubaki:'ツバキ 業を越えし忍び',
  rachana_story:'ラチャナ センレン寺 総師範',
  rihyo:'リヒョウ キョーダイ',
  leona_event:'レオナ 赤紅の傭兵団長',
  romold:'ロモルド 冷酷滅私',
};
const cards = JSON.parse(await readFile('/workspace/scratch/star-leap-reference-cards.json', 'utf8'));
const result = {};
for (const c of characters) {
  const matches=cards.filter(card=>card.name===target[c.id]);
  if (matches.length!==1 || !matches[0].src.startsWith('https://playershi.com/')) throw Error(`No unique image: ${c.id} ${target[c.id]}`);
  result[c.id]={version:matches[0].name,image:matches[0].src,detail:matches[0].detail};
}
if (Object.keys(result).length!==46) throw Error('Incomplete portrait map');
await writeFile(new URL('../assets/portrait-sources.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(`Mapped ${Object.keys(result).length} exact character versions.`);
