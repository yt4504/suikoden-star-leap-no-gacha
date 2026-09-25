import {characters,characterById,displayName} from './characters.mjs';
import {createState,setOwned,setLimitBreak,setUnitTags,assignSlot,addTeam,deleteTeam,updateTeam,exportState,importState,slots} from './model.mjs';
import {chooseCandidate,chooseSlot} from './team-selection.mjs';

const STORAGE='star-leap-no-gacha-v1';
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let state;
try { state=importState(localStorage.getItem(STORAGE)); } catch { state=createState(); }
let page='roster',teamIndex=0,selection={unitId:null,slot:null},eventOnly=false;
const filters={search:'',owned:'all',element:'all',role:'all'};
const candidateFilters={search:'',owned:'all',role:'all'};
const unit=id=>state.units[id]||{owned:false,breaks:0,tags:''};
const persist=next=>{state=next;localStorage.setItem(STORAGE,exportState(state));render();};
function flash(message,error=false) {const el=$('#flash');el.textContent=message;el.className=`flash show${error?' error':''}`;setTimeout(()=>el.classList.remove('show'),4500);}
const portrait=(c,large=false)=>{const crop=c.crop,style=large?` style="--zoom:${(204800/crop.width).toFixed(3)}%;--left:${(-100*crop.x/crop.width).toFixed(3)}%;--top:${(-100*crop.y/crop.width).toFixed(3)}%"`:'';return `<span class="portrait${large?' high-res':''}">${esc(c.name[0])}<img src="${esc(large?c.largeImage:c.image)}" alt="" loading="lazy"${style} onerror="this.remove()"></span>`;};
function renderStats() { $('#nav-count').textContent=characters.length;$('#team-count').textContent=state.teams.length;$('#owned-count').textContent=characters.filter(c=>unit(c.id).owned).length;$('#total-count').textContent=characters.length;$('#event-count').textContent=characters.filter(c=>c.source==='event').length; }
function renderRoster() {
  const list=characters.filter(c=>{
    const q=filters.search.toLocaleLowerCase();
    return (!q||c.name.toLocaleLowerCase().includes(q)||(unit(c.id).tags||'').toLocaleLowerCase().includes(q))&&(filters.owned==='all'||unit(c.id).owned===(filters.owned==='owned'))&&(filters.element==='all'||c.element===filters.element||c.weapon===filters.element)&&(filters.role==='all'||c.role===filters.role)&&(!eventOnly||c.source==='event');
  });
  $('#result-count').textContent=`${list.length} 人を表示`;
  $('#roster').innerHTML=list.length?list.map(c=>{const u=unit(c.id);return `<article class="card${u.owned?' owned':''}" title="${esc(c.name)}"><div class="card-top">${portrait(c,true)}<div class="card-body"><div class="card-name">${esc(displayName(c))}</div><div class="card-meta"><span class="badge element">${c.element} · ${c.weapon}</span><span class="badge">${c.role}</span>${c.source==='event'?'<span class="badge event">イベント</span>':''}</div></div></div><div class="tags" title="攻略タグ">${u.tags?'# '+esc(u.tags):'タグ未設定'}</div><div class="card-actions"><button class="own-button" data-own="${c.id}" aria-label="${esc(c.name)}を${u.owned?'未所持':'所持'}にする">${u.owned?'✓ 所持':'＋ 所持'}</button><span class="break-label">凸</span><span class="stepper"><button data-break="${c.id}" data-delta="-1" ${!u.breaks?'disabled':''} aria-label="${esc(c.name)}の凸数を減らす">−</button><strong>${u.breaks||0}</strong><button data-break="${c.id}" data-delta="1" ${u.breaks===6?'disabled':''} aria-label="${esc(c.name)}の凸数を増やす">＋</button></span><button class="tag-button" data-tag="${c.id}" aria-label="${esc(c.name)}の攻略タグを編集">タグ</button></div></article>`}).join(''):'<div class="empty">条件に合うキャラがいません。絞り込みを変更してください。</div>';
}
function renderTeams() {
  const candidateScroll=$('#candidate-list').scrollTop,candidateX=$('#candidate-list').scrollLeft;
  if(teamIndex>=state.teams.length) teamIndex=state.teams.length-1;
  $('#team-tabs').innerHTML=state.teams.map((t,i)=>`<button class="${i===teamIndex?'active':''}" data-team="${i}">${esc(t.name||`編成 ${i+1}`)}</button>`).join('');
  const t=state.teams[teamIndex];
  const slot=(key,label)=>{const c=characterById.get(t[key]),owned=c&&unit(c.id).owned;return `<div class="slot-wrap"><button class="slot${c?' filled':''}${c&&!owned?' unowned':''}${selection.slot===key?' selected':''}" data-slot="${key}" ${c?`data-drag-unit="${c.id}" draggable="true"`:''} aria-label="${label}${c?' '+c.name:' 空き'}">${c?portrait(c,true):'<span class="slot-icon">＋</span>'}<strong>${c?esc(displayName(c)):label}</strong>${c?`<small>${c.element} · ${c.role}${owned?'':' · 未所持'}</small>`:'<small>タップして選ぶ</small>'}</button>${c?`<button class="remove-slot" data-clear-slot="${key}" aria-label="${label}から${esc(c.name)}を外す" title="枠を空ける">×</button>`:''}</div>`};
  $('#team-editor').innerHTML=`<div class="team-editor"><div class="team-fields"><label>編成名<input id="team-name" maxlength="60" value="${esc(t.name)}"></label><label>攻略タグ<input id="team-tag" maxlength="60" value="${esc(t.tag)}" placeholder="例：討伐HARD4"></label><button class="danger" id="delete-team" ${state.teams.length===1?'disabled':''}>編成を削除</button></div><label class="team-note">攻略メモ<textarea id="team-note" maxlength="300" placeholder="役割分担や立ち回りのメモ">${esc(t.note)}</textarea></label><div class="formation"><div class="formation-group"><div class="formation-heading">前列 <span>FRONT LINE</span></div><div class="slot-grid">${['front1','front2','front3'].map((s,i)=>slot(s,`前列 ${i+1}`)).join('')}</div></div><div class="formation-group"><div class="formation-heading">後列 <span>BACK LINE</span></div><div class="slot-grid">${['back1','back2','back3'].map((s,i)=>slot(s,`後列 ${i+1}`)).join('')}</div></div></div><div class="formation-group support-row"><div class="formation-heading">支援 <span>SUPPORT</span></div>${slot('support','支援 1')}</div></div>`;
  renderCandidates();
  $('#candidate-list').scrollTop=candidateScroll;
  $('#candidate-list').scrollLeft=candidateX;
}
function renderCandidates() {
  const list=characters.filter(c=>c.name.toLocaleLowerCase().includes(candidateFilters.search.toLocaleLowerCase())&&(candidateFilters.owned==='all'||unit(c.id).owned)&&(candidateFilters.role==='all'||c.role===candidateFilters.role));
  $('#candidate-count').textContent=`${list.length}人`;
  $('#candidate-list').innerHTML=list.map(c=>`<button class="candidate${unit(c.id).owned?' owned':''}${selection.unitId===c.id?' selected':''}" data-pick="${c.id}" data-drag-unit="${c.id}" draggable="true" aria-label="${esc(c.name)}を選ぶ" aria-pressed="${selection.unitId===c.id}">${portrait(c,true)}<span class="candidate-info"><strong>${esc(displayName(c))}</strong><small>${c.element} · ${c.role}</small><small>${unit(c.id).owned?'所持':'未所持'}</small></span></button>`).join('')||'<p class="candidate-empty">該当する仲間はいません</p>';
}
function render(){renderStats();$('#roster-page').hidden=page!=='roster';$('#teams-page').hidden=page!=='teams';document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(page==='roster')renderRoster();else renderTeams();}
for(const key of ['element','role']) { const values=[...new Set(characters.map(c=>c[key]))];if(key==='element')values.push(...[...new Set(characters.map(c=>c.weapon))]);for(const v of values){const o=document.createElement('option');o.value=v;o.textContent=v;$('#'+key+'-filter').append(o);} }
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  try {
    if(b.dataset.page){page=b.dataset.page;selection={unitId:null,slot:null};render();return;}
    if(b.dataset.own){persist(setOwned(state,b.dataset.own,!unit(b.dataset.own).owned));return;}
    if(b.dataset.break){persist(setLimitBreak(state,b.dataset.break,Math.min(6,Math.max(0,(unit(b.dataset.break).breaks||0)+Number(b.dataset.delta)))));return;}
    if(b.dataset.tag){const id=b.dataset.tag;const value=prompt(`${characterById.get(id).name}の攻略タグ（読点区切り）`,unit(id).tags||'');if(value!==null)persist(setUnitTags(state,id,value));return;}
    if(b.id==='event-filter'){eventOnly=!eventOnly;b.setAttribute('aria-pressed',String(eventOnly));renderRoster();return;}
    if(b.id==='clear-filters'){filters.search='';filters.owned='all';filters.element='all';filters.role='all';eventOnly=false;$('#search').value='';for(const id of ['owned','element','role'])$('#'+id+'-filter').value='all';$('#event-filter').setAttribute('aria-pressed','false');renderRoster();return;}
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
for(const [input,key] of [['#search','search'],['#owned-filter','owned'],['#element-filter','element'],['#role-filter','role']]) $(input).addEventListener('input',e=>{filters[key]=e.target.value;renderRoster();});
document.addEventListener('input',e=>{if(e.target.id==='candidate-search'){candidateFilters.search=e.target.value;renderCandidates();}if(e.target.id==='candidate-owned'){candidateFilters.owned=e.target.value;renderCandidates();}if(e.target.id==='candidate-role'){candidateFilters.role=e.target.value;renderCandidates();}});
document.addEventListener('change',e=>{
  if(['team-name','team-tag','team-note'].includes(e.target.id)){const k={'team-name':'name','team-tag':'tag','team-note':'note'}[e.target.id];persist(updateTeam(state,teamIndex,{[k]:e.target.value}));}
});
$('#file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const incoming=importState(await file.text());persist(incoming);teamIndex=0;selection={unitId:null,slot:null};flash('JSONを読み込みました');}catch(err){flash(`読み込み失敗：${err.message}`,true);}finally{e.target.value='';}});
for(const role of [...new Set(characters.map(c=>c.role))]){const option=document.createElement('option');option.value=role;option.textContent=role;$('#candidate-role').append(option);}
document.addEventListener('dragstart',e=>{const source=e.target.closest('[data-drag-unit]');if(!source||!characterById.has(source.dataset.dragUnit))return;e.dataTransfer.setData('application/x-star-leap-unit',source.dataset.dragUnit);e.dataTransfer.effectAllowed='copyMove';});
document.addEventListener('dragover',e=>{const target=e.target.closest('[data-slot]');if(!target||!Array.from(e.dataTransfer.types).includes('application/x-star-leap-unit'))return;e.preventDefault();target.classList.add('drop-target');});
document.addEventListener('dragleave',e=>{const target=e.target.closest('[data-slot]');if(target&&!target.contains(e.relatedTarget))target.classList.remove('drop-target');});
document.addEventListener('drop',e=>{const target=e.target.closest('[data-slot]');if(!target)return;e.preventDefault();target.classList.remove('drop-target');const id=e.dataTransfer.getData('application/x-star-leap-unit');if(!characterById.has(id))return;selection={unitId:null,slot:null};persist(assignSlot(state,teamIndex,target.dataset.slot,id));});
document.addEventListener('dragend',()=>document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target')));
render();
