import {characters,characterById,displayName,acquisitionKind,acquisitionLabel} from './characters.mjs?v=sources-17';
import {createState,assignSlot,addTeam,deleteTeam,updateTeam,exportState,importState,assignedUnitIds} from './model.mjs?v=assigned-21';
import {chooseCandidate,chooseSlot} from './team-selection.mjs';
import {joinsInFutureUpdate} from './availability.mjs?v=current-16';
import {saveTeamImage} from './team-image.mjs?v=image-20';

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
  $('#team-editor').innerHTML=state.teams.map((t,i)=>{
    const slot=(key,label)=>{const c=characterById.get(t[key]),future=c&&joinsInFutureUpdate(c.id);return `<div class="slot-wrap"><button class="slot${c?' filled':''}${future?' future':''}${selection.slot===key&&teamIndex===i?' selected':''}" data-slot="${key}" ${c?`data-drag-unit="${c.id}" data-role="${c.role}"`:''} aria-label="${esc(t.name)} ${label}${c?' '+c.name:' 空き'}${future?'（今回の更新では加入不可）':''}">${c?portrait(c,true):'<span class="slot-icon">＋</span>'}<strong>${c?esc(displayName(c)):label}</strong>${c?`<small>${c.element} · ${c.role}</small>`:'<small>タップして選ぶ</small>'}</button>${c?`<button class="remove-slot" data-clear-slot="${key}" aria-label="${esc(t.name)} ${label}から${esc(c.name)}を外す" title="枠を空ける">×</button>`:''}</div>`};
    return `<section class="team-card${i===teamIndex?' active':''}" data-team-index="${i}" aria-label="${esc(t.name||`編成 ${i+1}`)}"><div class="team-card-head"><h3>${esc(t.name||`編成 ${i+1}`)}</h3><button class="ghost save-image" data-save-image>画像保存 ↓</button></div><div class="team-editor"><div class="team-fields"><label>編成名<input data-field="name" maxlength="60" value="${esc(t.name)}"></label><label>攻略タグ<input data-field="tag" maxlength="60" value="${esc(t.tag)}" placeholder="例：討伐HARD4"></label><button class="danger" data-delete-team ${state.teams.length===1?'disabled':''}>編成を削除</button></div><label class="team-note">攻略メモ<textarea data-field="note" maxlength="300" placeholder="役割分担や立ち回りのメモ">${esc(t.note)}</textarea></label><div class="formation"><div class="formation-group"><div class="formation-heading">前列 <span>FRONT LINE</span></div><div class="slot-grid">${['front1','front2','front3'].map((s,n)=>slot(s,`前列 ${n+1}`)).join('')}</div></div><div class="formation-group"><div class="formation-heading">後列 <span>BACK LINE</span></div><div class="slot-grid">${['back1','back2','back3'].map((s,n)=>slot(s,`後列 ${n+1}`)).join('')}</div></div></div><div class="formation-group support-row"><div class="formation-heading">支援 <span>SUPPORT</span></div>${slot('support','支援 1')}</div></div></section>`;
  }).join('')+'<button id="add-team" class="primary add-team-bottom">＋ 編成を追加</button>';
  renderCandidates();
  $('#candidate-list').scrollTop=candidateScroll;
  $('#candidate-list').scrollLeft=candidateX;
}
function renderCandidates() {
  const list=characters.filter(c=>(candidateFilters.element==='all'||c.element===candidateFilters.element)&&(candidateFilters.source==='all'||acquisitionKind(c)===candidateFilters.source)&&c.name.toLocaleLowerCase().includes(candidateFilters.search.toLocaleLowerCase())&&(candidateFilters.role==='all'||c.role===candidateFilters.role));
  const assigned=assignedUnitIds(state,teamIndex);
  $('#candidate-title').textContent='仲間一覧';
  $('#candidate-sources').innerHTML=sourceOptions.map(([value,label])=>`<button type="button" data-source="${value}" aria-pressed="${candidateFilters.source===value}">${label}<span>${value==='all'?characters.length:characters.filter(c=>acquisitionKind(c)===value).length}</span></button>`).join('');
  $('#candidate-elements').innerHTML=[['all','全員'],...elements.map(e=>[e,e])].map(([value,label])=>`<button type="button" data-element="${value}" aria-pressed="${candidateFilters.element===value}">${label}<span>${value==='all'?characters.length:characters.filter(c=>c.element===value).length}</span></button>`).join('');
  $('#candidate-count').textContent=`${list.length}人`;
  const card=c=>{const future=joinsInFutureUpdate(c.id),used=assigned.has(c.id),kind=acquisitionKind(c),label=acquisitionLabel(c);return `<button class="candidate${future?' future':''}${used?' assigned':''}${selection.unitId===c.id?' selected':''}" data-pick="${c.id}" ${used?'disabled':`data-drag-unit="${c.id}"`} data-role="${c.role}" data-acquisition="${kind}" aria-label="${esc(c.name)}、${label}${future?'（今回の更新では加入不可）':''}${used?'、この編成に配置済み':'を選ぶ'}" ${used?'title="この編成に配置済み"':`aria-pressed="${selection.unitId===c.id}"`}>${portrait(c,true)}<span class="acquisition-badge">${label}</span><span class="candidate-info"><strong>${esc(displayName(c))}</strong><small class="candidate-role">${c.role}</small></span></button>`;};
  $('#candidate-list').innerHTML=elements.map(element=>{
    const members=list.filter(c=>c.element===element).sort((a,b)=>roleOrder.indexOf(a.role)-roleOrder.indexOf(b.role));
    return members.length?`<section class="candidate-group" data-element="${element}" aria-label="${element}属性"><div class="candidate-group-head"><strong>${element}属性</strong><small>${members.length}人</small></div>${members.map(card).join('')}</section>`:'';
  }).join('')||'<p class="candidate-empty">該当する仲間はいません</p>';
}
function render(){renderTeams();}
let suppressClick=false;
document.addEventListener('click',e=>{
  if(suppressClick){e.preventDefault();suppressClick=false;return;}
  const activeCard=e.target.closest('.team-card');
  if(activeCard&&Number(activeCard.dataset.teamIndex)!==teamIndex){teamIndex=Number(activeCard.dataset.teamIndex);selection={unitId:null,slot:null};document.querySelectorAll('.team-card').forEach(card=>card.classList.toggle('active',Number(card.dataset.teamIndex)===teamIndex));renderCandidates();}
  const b=e.target.closest('button');if(!b)return;
  try {
    if(b.dataset.element){candidateFilters.element=b.dataset.element;$('#candidate-list').scrollTop=0;renderCandidates();return;}
    if(b.dataset.source){candidateFilters.source=b.dataset.source;$('#candidate-list').scrollTop=0;renderCandidates();return;}
    if(b.id==='add-team'){teamIndex=state.teams.length;selection={unitId:null,slot:null};persist(addTeam(state));$('#team-editor .team-card:last-of-type')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(b.dataset.clearSlot){const index=Number(b.closest('.team-card').dataset.teamIndex);selection={unitId:null,slot:null};teamIndex=index;persist(assignSlot(state,index,b.dataset.clearSlot,null));return;}
    if(b.dataset.slot){const index=Number(b.closest('.team-card').dataset.teamIndex);if(index!==teamIndex)selection.slot=null;teamIndex=index;const result=chooseSlot(selection,b.dataset.slot);selection=result.selection;if(result.placement)persist(assignSlot(state,index,result.placement.slot,result.placement.unitId));else renderTeams();return;}
    if(b.dataset.pick){if(assignedUnitIds(state,teamIndex).has(b.dataset.pick))return;const result=chooseCandidate(selection,b.dataset.pick);selection=result.selection;if(result.placement)persist(assignSlot(state,teamIndex,result.placement.slot,result.placement.unitId));else renderTeams();return;}
    if(b.hasAttribute('data-delete-team')){const index=Number(b.closest('.team-card').dataset.teamIndex);if(confirm('この編成を削除しますか？')){selection={unitId:null,slot:null};teamIndex=Math.min(index,state.teams.length-2);persist(deleteTeam(state,index));}return;}
    if(b.hasAttribute('data-save-image')){const index=Number(b.closest('.team-card').dataset.teamIndex);saveTeamImage(state.teams[index]).then(()=>flash('編成画像を保存しました')).catch(err=>flash(err.message,true));return;}
  }catch(err){flash(err.message,true);}
});
document.addEventListener('input',e=>{if(e.target.id==='candidate-search'){candidateFilters.search=e.target.value;if(candidateFilters.search)candidateFilters.element='all';renderCandidates();}if(e.target.id==='candidate-role'){candidateFilters.role=e.target.value;renderCandidates();}});
document.addEventListener('change',e=>{
  if(e.target.dataset.field){const index=Number(e.target.closest('.team-card').dataset.teamIndex);persist(updateTeam(state,index,{[e.target.dataset.field]:e.target.value}));}
});
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
  if(target&&characterById.has(finished.id)){teamIndex=Number(target.closest('.team-card').dataset.teamIndex);selection={unitId:null,slot:null};persist(assignSlot(state,teamIndex,target.dataset.slot,finished.id));}
});
document.addEventListener('pointercancel',()=>{drag?.ghost?.remove();drag=null;document.body.classList.remove('dragging-unit');document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));});
render();
