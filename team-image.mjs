import {characterById,displayName} from './characters.mjs?v=sources-17';

const font='"Noto Sans JP", sans-serif';
const ink='#f0ece4';
const loadImage=src=>new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>resolve(image);
  image.onerror=()=>reject(new Error('キャラ画像を読み込めませんでした'));
  image.src=src;
});

export async function saveTeamImage(team) {
  const ids=[team.front1,team.front2,team.front3,team.back1,team.back2,team.back3,team.support].filter(Boolean);
  const portraits=new Map(await Promise.all(ids.map(async id=>{
    const c=characterById.get(id);
    try{return [id,await loadImage(c.largeImage)];}
    catch{return [id,await loadImage(c.image)];}
  })));
  const canvas=document.createElement('canvas');
  canvas.width=1120;canvas.height=1020;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('画像を作成できませんでした');
  ctx.fillStyle='#15191e';ctx.fillRect(0,0,1120,1020);
  ctx.fillStyle='#d4b77d';ctx.font=`18px ${font}`;ctx.fillText('STAR LEAP  ·  ガチャ縛り編成帳',42,48);
  ctx.fillStyle=ink;ctx.font=`bold 34px ${font}`;ctx.fillText(team.name||'編成',42,105,1030);
  if(team.tag){ctx.fillStyle='#ddc493';ctx.font=`19px ${font}`;ctx.fillText(team.tag,42,142,1030);}

  function portrait(c,x,y,size){
    const image=portraits.get(c.id),crop=c.crop;
    ctx.save();ctx.beginPath();ctx.roundRect(x,y,size,size,6);ctx.clip();
    ctx.fillStyle='#4b5052';ctx.fillRect(x,y,size,size);
    if(image){
      if(image.width>1000&&crop){const scale=image.width/2048;ctx.drawImage(image,crop.x*scale,crop.y*scale,crop.width*scale,crop.width*scale,x,y,size,size);}
      else ctx.drawImage(image,x,y,size,size);
    }
    ctx.restore();
  }
  function card(id,x,y,width=330,height=220){
    ctx.fillStyle='#242b30';ctx.beginPath();ctx.roundRect(x,y,width,height,8);ctx.fill();
    ctx.strokeStyle=id?'#9b8059':'#515960';ctx.stroke();
    if(!id)return;
    const c=characterById.get(id);
    portrait(c,x+(width-126)/2,y+12,126);
    ctx.textAlign='center';ctx.fillStyle=ink;ctx.font=`bold 21px ${font}`;
    ctx.fillText(displayName(c),x+width/2,y+164,width-18);
    ctx.fillStyle='#c5c5bf';ctx.font=`16px ${font}`;
    ctx.fillText(`${c.element} · ${c.role}`,x+width/2,y+195,width-18);
    ctx.textAlign='left';
  }
  function row(label,keys,y){
    ctx.fillStyle='#e5c794';ctx.font=`bold 22px ${font}`;ctx.fillText(label,42,y-15);
    keys.forEach((key,i)=>card(team[key],42+i*348,y));
  }
  row('前列',['front1','front2','front3'],205);
  row('後列',['back1','back2','back3'],505);
  ctx.fillStyle='#e5c794';ctx.font=`bold 22px ${font}`;ctx.fillText('支援',42,785);
  card(team.support,42,800,330,220);
  if(team.note){ctx.fillStyle='#c6c4bd';ctx.font=`17px ${font}`;ctx.fillText(team.note.replace(/\s+/g,' ').slice(0,65),395,875,660);}
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('画像を保存できませんでした');
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`star-leap-${(team.name||'編成').replace(/[\\/:*?"<>|]/g,'_')}.png`;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
