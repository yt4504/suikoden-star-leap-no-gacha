import {characters,characterById} from './characters.mjs';
import {createState,setOwned,setLimitBreak,setUnitTags,assignSlot,addTeam,deleteTeam,updateTeam,exportState,importState,slots} from './model.mjs';

const STORAGE='star-leap-no-gacha-v1';
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let state;
try { state=importState(localStorage.getItem(STORAGE)); } catch { state=createState(); }
let page='roster',teamIndex=0,picking=null,eventOnly=false;
const filters={search:'',owned:'all',element:'all',role:'all'};
const unit=id=>state.units[id]||{owned:false,breaks:0,tags:''};
const persist=next=>{state=next;localStorage.setItem(STORAGE,exportState(state));render();};
function flash(message,error=false) {const el=$('#flash');el.textContent=message;el.className=`flash show${error?' error':''}`;setTimeout(()=>el.classList.remove('show'),4500);}
const portrait=c=>`<span class="portrait">${esc(c.name[0])}${c.image?`<img src="${esc(c.image)}" alt="" loading="lazy" onerror="this.remove()">`:''}</span>`;
function renderStats() { $('#nav-count').textContent=characters.length;$('#team-count').textContent=state.teams.length;$('#owned-count').textContent=characters.filter(c=>unit(c.id).owned).length;$('#total-count').textContent=characters.length;$('#event-count').textContent=characters.filter(c=>c.source==='event').length; }
function renderRoster() {
  const list=characters.filter(c=>{
    const q=filters.search.toLocaleLowerCase();
    return (!q||c.name.toLocaleLowerCase().includes(q)||(unit(c.id).tags||'').toLocaleLowerCase().includes(q))&&(filters.owned==='all'||unit(c.id).owned===(filters.owned==='owned'))&&(filters.element==='all'||c.element===filters.element||c.weapon===filters.element)&&(filters.role==='all'||c.role===filters.role)&&(!eventOnly||c.source==='event');
  });
  $('#result-count').textContent=`${list.length} 人を表示`;
  $('#roster').innerHTML=list.length?list.map(c=>{const u=unit(c.id);return `<article class="card${u.owned?' owned':''}"><div class="card-top">${portrait(c)}<div class="card-body"><div class="card-name">${esc(c.name)}</div><div class="card-meta"><span class="badge element">${c.element} · ${c.weapon}</span><span class="badge">${c.role}</span>${c.source==='event'?'<span class="badge event">イベント</span>':''}</div></div></div><div class="tags" title="攻略タグ">${u.tags?'# '+esc(u.tags):'タグ未設定'}</div><div class="card-actions"><button class="own-button" data-own="${c.id}" aria-label="${esc(c.name)}を${u.owned?'未所持':'所持'}にする">${u.owned?'✓ 所持':'＋ 所持'}</button><span class="break-label">凸</span><span class="stepper"><button data-break="${c.id}" data-delta="-1" ${!u.breaks?'disabled':''} aria-label="${esc(c.name)}の凸数を減らす">−</button><strong>${u.breaks||0}</strong><button data-break="${c.id}" data-delta="1" ${u.breaks===6?'disabled':''} aria-label="${esc(c.name)}の凸数を増やす">＋</button></span><button class="tag-button" data-tag="${c.id}" aria-label="${esc(c.name)}の攻略タグを編集">タグ</button></div></article>`}).join(''):'<div class="empty">条件に合うキャラがいません。絞り込みを変更してください。</div>';
}
function renderTeams() {
  if(teamIndex>=state.teams.length) teamIndex=state.teams.length-1;
  $('#team-tabs').innerHTML=state.teams.map((t,i)=>`<button class="${i===teamIndex?'active':''}" data-team="${i}">${esc(t.name||`編成 ${i+1}`)}</button>`).join('');
  const t=state.teams[teamIndex];
  const slot=(key,label)=>{const c=characterById.get(t[key]),owned=c&&unit(c.id).owned;return `<button class="slot${c?' filled':''}${c&&!owned?' unowned':''}${picking===key?' selected':''}" data-slot="${key}" aria-label="${label}${c?' '+c.name:' 空き'}"><span class="slot-icon">${c?'✦':'＋'}</span><strong>${c?esc(c.name):label}</strong>${c?`<small>${c.element} · ${c.role}${owned?'':' · 未所持'}</small>`:'<small>クリックして選ぶ</small>'}</button>`};
  $('#team-editor').innerHTML=`<div class="team-editor"><div class="team-fields"><label>編成名<input id="team-name" maxlength="60" value="${esc(t.name)}"></label><label>攻略タグ<input id="team-tag" maxlength="60" value="${esc(t.tag)}" placeholder="例：討伐HARD4"></label><button class="danger" id="delete-team" ${state.teams.length===1?'disabled':''}>編成を削除</button></div><label class="team-note">攻略メモ<textarea id="team-note" maxlength="300" placeholder="役割分担や立ち回りのメモ">${esc(t.note)}</textarea></label><div class="formation"><div class="formation-group"><div class="formation-heading">前列 <span>FRONT LINE</span></div><div class="slot-grid">${['front1','front2','front3'].map((s,i)=>slot(s,`前列 ${i+1}`)).join('')}</div></div><div class="formation-group"><div class="formation-heading">後列 <span>BACK LINE</span></div><div class="slot-grid">${['back1','back2','back3'].map((s,i)=>slot(s,`後列 ${i+1}`)).join('')}</div></div></div><div class="formation-group support-row"><div class="formation-heading">支援 <span>SUPPORT</span></div>${slot('support','支援 1')}</div></div>`;
  renderPicker();
}
function renderPicker() {
  const pane=$('#picker');
  if(!picking) {pane.hidden=true;return;}
  pane.hidden=false;
  const current=state.teams[teamIndex][picking];
  pane.innerHTML=`<div class="picker-head"><h3>${picking==='support'?'支援':picking.startsWith('front')?'前列':'後列'}の仲間を選ぶ</h3><button class="ghost" id="close-picker">閉じる</button></div><div class="picker-controls"><input id="picker-search" aria-label="編成候補を検索" placeholder="名前を検索"><button class="ghost" id="clear-slot" ${!current?'disabled':''}>枠を空ける</button></div><div class="picker-list" id="picker-list"></div>`;
  renderPickerList('');
}
function renderPickerList(q) {
  const list=characters.filter(c=>c.name.toLocaleLowerCase().includes(q.toLocaleLowerCase()));
  $('#picker-list').innerHTML=list.map(c=>`<button data-pick="${c.id}" class="${unit(c.id).owned?'':'missing'}">${esc(c.name)}<small>${c.element} · ${c.role} · ${unit(c.id).owned?'所持':'未所持'}</small></button>`).join('')||'<span>該当する仲間はいません</span>';
}
function render(){renderStats();$('#roster-page').hidden=page!=='roster';$('#teams-page').hidden=page!=='teams';document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(page==='roster')renderRoster();else renderTeams();}
for(const key of ['element','role']) { const values=[...new Set(characters.map(c=>c[key]))];if(key==='element')values.push(...[...new Set(characters.map(c=>c.weapon))]);for(const v of values){const o=document.createElement('option');o.value=v;o.textContent=v;$('#'+key+'-filter').append(o);} }
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  try {
    if(b.dataset.page){page=b.dataset.page;picking=null;render();return;}
    if(b.dataset.own){persist(setOwned(state,b.dataset.own,!unit(b.dataset.own).owned));return;}
    if(b.dataset.break){persist(setLimitBreak(state,b.dataset.break,Math.min(6,Math.max(0,(unit(b.dataset.break).breaks||0)+Number(b.dataset.delta)))));return;}
    if(b.dataset.tag){const id=b.dataset.tag;const value=prompt(`${characterById.get(id).name}の攻略タグ（読点区切り）`,unit(id).tags||'');if(value!==null)persist(setUnitTags(state,id,value));return;}
    if(b.id==='event-filter'){eventOnly=!eventOnly;b.setAttribute('aria-pressed',String(eventOnly));renderRoster();return;}
    if(b.id==='clear-filters'){filters.search='';filters.owned='all';filters.element='all';filters.role='all';eventOnly=false;$('#search').value='';for(const id of ['owned','element','role'])$('#'+id+'-filter').value='all';$('#event-filter').setAttribute('aria-pressed','false');renderRoster();return;}
    if(b.id==='add-team'){persist(addTeam(state));teamIndex=state.teams.length-1;render();return;}
    if(b.dataset.team){teamIndex=Number(b.dataset.team);picking=null;render();return;}
    if(b.dataset.slot){picking=b.dataset.slot;renderTeams();$('#picker').scrollIntoView({block:'nearest',behavior:'smooth'});return;}
    if(b.id==='close-picker'){picking=null;renderTeams();return;}
    if(b.id==='clear-slot'){persist(assignSlot(state,teamIndex,picking,null));picking=null;render();return;}
    if(b.dataset.pick){persist(assignSlot(state,teamIndex,picking,b.dataset.pick));picking=null;render();return;}
    if(b.id==='delete-team'){if(confirm('この編成を削除しますか？')){persist(deleteTeam(state,teamIndex));picking=null;render();}return;}
    if(b.id==='export'){const blob=new Blob([exportState(state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`star-leap-no-gacha-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);flash('JSONを保存しました');return;}
    if(b.id==='import'){$('#file').click();return;}
  }catch(err){flash(err.message,true);}
});
for(const [input,key] of [['#search','search'],['#owned-filter','owned'],['#element-filter','element'],['#role-filter','role']]) $(input).addEventListener('input',e=>{filters[key]=e.target.value;renderRoster();});
document.addEventListener('input',e=>{if(e.target.id==='picker-search')renderPickerList(e.target.value);});
document.addEventListener('change',e=>{
  if(['team-name','team-tag','team-note'].includes(e.target.id)){const k={'team-name':'name','team-tag':'tag','team-note':'note'}[e.target.id];persist(updateTeam(state,teamIndex,{[k]:e.target.value}));}
});
$('#file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const incoming=importState(await file.text());persist(incoming);teamIndex=0;picking=null;flash('JSONを読み込みました');}catch(err){flash(`読み込み失敗：${err.message}`,true);}finally{e.target.value='';}});
render();
