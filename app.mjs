import {characters,characterById,displayName,acquisitionKind,acquisitionLabel} from './characters.mjs?v=sources-17';
import {createState,assignSlot,addTeam,deleteTeam,updateTeam,exportState,importState} from './model.mjs';
import {chooseCandidate,chooseSlot} from './team-selection.mjs';
import {joinsInFutureUpdate} from './availability.mjs?v=current-16';

const STORAGE='star-leap-no-gacha-v1';
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let state;
try { state=importState(localStorage.getItem(STORAGE)); } catch { state=createState(); }
let teamIndex=0,selection={unitId:null,slot:null};
const elements=[...new Set(characters.map(c=>c.element))];
const roleOrder=['攻手','守護','回復','補助'];
const candidateFilters={search:'',role:'all',element:'all',source:'all'};
const sourceOptions=[['all','すべて'],['star','108星'],['event','イベント限定'],['exchange','コイン交換'],['mission','ミッション配布']];
const persist=next=>{state=next;localStorage.setItem(STORAGE,exportState(state));render();};
function flash(message,error=false) {const el=$('#flash');el.textContent=message;el.className=`flash show${error?' error':''}`;setTimeout(()=>el.classList.remove('show'),4500);}
const portrait=(c,large=false)=>{const crop=c.crop,style=large?` style="--zoom:${(204800/crop.width).toFixed(3)}%;--left:${(-100*crop.x/crop.width).toFixed(3)}%;--top:${(-100*crop.y/crop.width).toFixed(3)}%"`:'';return `<span class="portrait${large?' high-res':''}">${esc(c.name[0])}<img src="${esc(large?c.largeImage:c.image)}" alt="" loading="lazy" draggable="false"${style} onerror="this.remove()"></span>`;};
function renderTeams() {
  const candidateScroll=$('#candidate-list').scrollTop,candidateX=$('#candidate-list').scrollLeft;
  if(teamIndex>=state.teams.length) teamIndex=state.teams.length-1;
  $('#team-tabs').innerHTML=state.teams.map((t,i)=>`<button class="${i===teamIndex?'active':''}" data-team="${i}">${esc(t.name||`編成 ${i+1}`)}</button>`).join('');
  const t=state.teams[teamIndex];
  const slot=(key,label)=>{const c=characterById.get(t[key]),future=c&&joinsInFutureUpdate(c.id);return `<div class="slot-wrap"><button class="slot${c?' filled':''}${future?' future':''}${selection.slot===key?' selected':''}" data-slot="${key}" ${c?`data-drag-unit="${c.id}" data-role="${c.role}"`:''} aria-label="${label}${c?' '+c.name:' 空き'}${future?'（今回の更新では加入不可）':''}">${c?portrait(c,true):'<span class="slot-icon">＋</span>'}<strong>${c?esc(displayName(c)):label}</strong>${c?`<small>${c.element} · ${c.role}</small>`:'<small>タップして選ぶ</small>'}</button>${c?`<button class="remove-slot" data-clear-slot="${key}" aria-label="${label}から${esc(c.name)}を外す" title="枠を空ける">×</button>`:''}</div>`};
  $('#team-editor').innerHTML=`<div class="team-editor"><div class="team-fields"><label>編成名<input id="team-name" maxlength="60" value="${esc(t.name)}"></label><label>攻略タグ<input id="team-tag" maxlength="60" value="${esc(t.tag)}" placeholder="例：討伐HARD4"></label><button class="danger" id="delete-team" ${state.teams.length===1?'disabled':''}>編成を削除</button></div><label class="team-note">攻略メモ<textarea id="team-note" maxlength="300" placeholder="役割分担や立ち回りのメモ">${esc(t.note)}</textarea></label><div class="formation"><div class="formation-group"><div class="formation-heading">前列 <span>FRONT LINE</span></div><div class="slot-grid">${['front1','front2','front3'].map((s,i)=>slot(s,`前列 ${i+1}`)).join('')}</div></div><div class="formation-group"><div class="formation-heading">後列 <span>BACK LINE</span></div><div class="slot-grid">${['back1','back2','back3'].map((s,i)=>slot(s,`後列 ${i+1}`)).join('')}</div></div></div><div class="formation-group support-row"><div class="formation-heading">支援 <span>SUPPORT</span></div>${slot('support','支援 1')}</div></div>`;
  renderCandidates();
  $('#candidate-list').scrollTop=candidateScroll;
  $('#candidate-list').scrollLeft=candidateX;
}
function renderCandidates() {
  const list=characters.filter(c=>(candidateFilters.element==='all'||c.element===candidateFilters.element)&&(candidateFilters.source==='all'||acquisitionKind(c)===candidateFilters.source)&&c.name.toLocaleLowerCase().includes(candidateFilters.search.toLocaleLowerCase())&&(candidateFilters.role==='all'||c.role===candidateFilters.role));
  $('#candidate-title').textContent='仲間一覧';
  $('#candidate-sources').innerHTML=sourceOptions.map(([value,label])=>`<button type="button" data-source="${value}" aria-pressed="${candidateFilters.source===value}">${label}<span>${value==='all'?characters.length:characters.filter(c=>acquisitionKind(c)===value).length}</span></button>`).join('');
  $('#candidate-elements').innerHTML=[['all','全員'],...elements.map(e=>[e,e])].map(([value,label])=>`<button type="button" data-element="${value}" aria-pressed="${candidateFilters.element===value}">${label}<span>${value==='all'?characters.length:characters.filter(c=>c.element===value).length}</span></button>`).join('');
  $('#candidate-count').textContent=`${list.length}人`;
  const card=c=>{const future=joinsInFutureUpdate(c.id),kind=acquisitionKind(c),label=acquisitionLabel(c);return `<button class="candidate${future?' future':''}${selection.unitId===c.id?' selected':''}" data-pick="${c.id}" data-drag-unit="${c.id}" data-role="${c.role}" data-acquisition="${kind}" aria-label="${esc(c.name)}、${label}${future?'（今回の更新では加入不可）':''}を選ぶ" aria-pressed="${selection.unitId===c.id}">${portrait(c,true)}<span class="acquisition-badge">${label}</span><span class="candidate-info"><strong>${esc(displayName(c))}</strong><small class="candidate-role">${c.role}</small></span></button>`;};
  $('#candidate-list').innerHTML=elements.map(element=>{
    const members=list.filter(c=>c.element===element).sort((a,b)=>roleOrder.indexOf(a.role)-roleOrder.indexOf(b.role));
    return members.length?`<section class="candidate-group" data-element="${element}" aria-label="${element}属性"><div class="candidate-group-head"><strong>${element}属性</strong><small>${members.length}人</small></div>${members.map(card).join('')}</section>`:'';
  }).join('')||'<p class="candidate-empty">該当する仲間はいません</p>';
}
function render(){renderTeams();}
let suppressClick=false;
document.addEventListener('click',e=>{
  if(suppressClick){e.preventDefault();suppressClick=false;return;}
  const b=e.target.closest('button');if(!b)return;
  try {
    if(b.dataset.element){candidateFilters.element=b.dataset.element;$('#candidate-list').scrollTop=0;renderCandidates();return;}
    if(b.dataset.source){candidateFilters.source=b.dataset.source;$('#candidate-list').scrollTop=0;renderCandidates();return;}
    if(b.id==='add-team'){persist(addTeam(state));teamIndex=state.teams.length-1;render();return;}
    if(b.dataset.team){teamIndex=Number(b.dataset.team);selection={unitId:null,slot:null};render();return;}
    if(b.dataset.clearSlot){persist(assignSlot(state,teamIndex,b.dataset.clearSlot,null));selection={unitId:null,slot:null};return;}
    if(b.dataset.slot){const result=chooseSlot(selection,b.dataset.slot);selection=result.selection;if(result.placement)persist(assignSlot(state,teamIndex,result.placement.slot,result.placement.unitId));else renderTeams();return;}
    if(b.dataset.pick){const result=chooseCandidate(selection,b.dataset.pick);selection=result.selection;if(result.placement)persist(assignSlot(state,teamIndex,result.placement.slot,result.placement.unitId));else renderTeams();return;}
    if(b.id==='delete-team'){if(confirm('この編成を削除しますか？')){persist(deleteTeam(state,teamIndex));selection={unitId:null,slot:null};render();}return;}
    if(b.id==='export'){const blob=new Blob([exportState(state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`star-leap-no-gacha-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);flash('JSONを保存しました');return;}
    if(b.id==='import'){$('#file').click();return;}
  }catch(err){flash(err.message,true);}
});
document.addEventListener('input',e=>{if(e.target.id==='candidate-search'){candidateFilters.search=e.target.value;if(candidateFilters.search)candidateFilters.element='all';renderCandidates();}if(e.target.id==='candidate-role'){candidateFilters.role=e.target.value;renderCandidates();}});
document.addEventListener('change',e=>{
  if(['team-name','team-tag','team-note'].includes(e.target.id)){const k={'team-name':'name','team-tag':'tag','team-note':'note'}[e.target.id];persist(updateTeam(state,teamIndex,{[k]:e.target.value}));}
});
$('#file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const incoming=importState(await file.text());persist(incoming);teamIndex=0;selection={unitId:null,slot:null};flash('JSONを読み込みました');}catch(err){flash(`読み込み失敗：${err.message}`,true);}finally{e.target.value='';}});
for(const role of [...new Set(characters.map(c=>c.role))]){const option=document.createElement('option');option.value=role;option.textContent=role;$('#candidate-role').append(option);}
let drag=null;
document.addEventListener('pointerdown',e=>{const source=e.target.closest('[data-drag-unit]');if(!source||e.button!==0||e.pointerType==='touch')return;drag={id:source.dataset.dragUnit,x:e.clientX,y:e.clientY,active:false,ghost:null};});
document.addEventListener('pointermove',e=>{
  if(!drag)return;
  if(!drag.active&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>10){drag.active=true;drag.ghost=document.createElement('div');drag.ghost.className='drag-ghost';drag.ghost.textContent=displayName(characterById.get(drag.id));document.body.append(drag.ghost);document.body.classList.add('dragging-unit');}
  if(!drag.active)return;
  e.preventDefault();drag.ghost.style.left=`${e.clientX+12}px`;drag.ghost.style.top=`${e.clientY+12}px`;
  document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
  document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]')?.classList.add('drop-target');
});
document.addEventListener('pointerup',e=>{
  if(!drag)return;
  const finished=drag;drag=null;
  if(!finished.active)return;
  finished.ghost.remove();document.body.classList.remove('dragging-unit');
  document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
  suppressClick=true;setTimeout(()=>{suppressClick=false;},0);
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');
  if(target&&characterById.has(finished.id)){selection={unitId:null,slot:null};persist(assignSlot(state,teamIndex,target.dataset.slot,finished.id));}
});
document.addEventListener('pointercancel',()=>{drag?.ghost?.remove();drag=null;document.body.classList.remove('dragging-unit');document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));});
render();
