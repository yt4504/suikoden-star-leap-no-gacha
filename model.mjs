import { characterById } from './characters.mjs';

export const slots = ['front1','front2','front3','back1','back2','back3','support'];
export const assignedUnitIds = state => new Set(state.teams.flatMap(team=>slots.map(slot=>team[slot])).filter(Boolean));
const storageVersion = 1;
export const newTeam = (number = 1) => ({id: crypto.randomUUID(),name:`編成 ${number}`,tag:'',note:'',...Object.fromEntries(slots.map(s=>[s,null]))});
export const createState = () => ({version:storageVersion,units:{},teams:[newTeam()]});
const validId = id => { if(!characterById.has(id)) throw new Error('対象外のキャラが含まれています'); };
const copy = state => structuredClone(state);

export function setOwned(state,id,owned) {
  validId(id);
  const next=copy(state); next.units[id]={...(next.units[id]||{}),owned:!!owned}; return next;
}
export function setLimitBreak(state,id,breaks) {
  validId(id);
  if(!Number.isInteger(breaks)||breaks<0||breaks>6) throw new Error('凸数は0～6を指定してください');
  const next=copy(state); next.units[id]={...(next.units[id]||{}),breaks}; return next;
}
export function setUnitTags(state,id,tags) {
  validId(id);
  const next=copy(state); next.units[id]={...(next.units[id]||{}),tags:normalizeTags(tags)}; return next;
}
export function normalizeTags(value) { return String(value).split(/[,、\n]/).map(v=>v.trim()).filter(Boolean).slice(0,8).map(v=>v.slice(0,24)).join('、'); }
export function assignSlot(state,teamIndex,slot,id) {
  if(!slots.includes(slot)||!state.teams[teamIndex]) throw new Error('編成枠が見つかりません');
  if(id!==null) {
    validId(id);
    if(state.teams.some((team,index)=>index!==teamIndex&&slots.some(key=>team[key]===id))) throw new Error('このキャラは別の編成で使用中です');
  }
  const next=copy(state),team=next.teams[teamIndex];
  if(id!==null) for(const s of slots) if(team[s]===id) team[s]=null;
  team[slot]=id; return next;
}
export function addTeam(state) { const next=copy(state); next.teams.push(newTeam(next.teams.length+1)); return next; }
export function deleteTeam(state,index) {
  if(state.teams.length===1||!state.teams[index]) throw new Error('最後の編成は削除できません');
  const next=copy(state); next.teams.splice(index,1); return next;
}
export function updateTeam(state,index,changes) {
  if(!state.teams[index]) throw new Error('編成が見つかりません');
  const next=copy(state);
  for(const key of ['name','tag','note']) if(key in changes) next.teams[index][key]=String(changes[key]).slice(0,key==='note'?300:60);
  return next;
}
export function exportState(state) { return JSON.stringify(validate(state),null,2); }
export function importState(text) {
  let data; try { data=JSON.parse(text); } catch { throw new Error('JSONを読み取れません'); }
  return validate(data);
}
export function validate(data) {
  if(!data||data.version!==storageVersion||!data.units||typeof data.units!=='object'||Array.isArray(data.units)||!Array.isArray(data.teams)||data.teams.length<1||data.teams.length>100) throw new Error('対応していない保存データです');
  const next={version:storageVersion,units:{},teams:[]};
  for(const [id,u] of Object.entries(data.units)) {
    validId(id);
    if(!u||typeof u!=='object'||(u.owned!==undefined&&typeof u.owned!=='boolean')||(u.breaks!==undefined&&(!Number.isInteger(u.breaks)||u.breaks<0||u.breaks>6))||(u.tags!==undefined&&typeof u.tags!=='string')) throw new Error('キャラの保存データが不正です');
    next.units[id]={owned:u.owned===true,breaks:u.breaks??0,tags:normalizeTags(u.tags??'')};
  }
  for(const team of data.teams) {
    if(!team||typeof team.id!=='string'||typeof team.name!=='string'||typeof team.tag!=='string'||typeof team.note!=='string') throw new Error('編成の保存データが不正です');
    const seen=new Set(),clean={id:team.id.slice(0,80),name:team.name.slice(0,60),tag:team.tag.slice(0,60),note:team.note.slice(0,300)};
    for(const s of slots) {
      const id=team[s];
      if(id!==null) {validId(id); if(seen.has(id)) throw new Error('同じ編成に重複したキャラが含まれます');seen.add(id);}
      clean[s]=id;
    }
    next.teams.push(clean);
  }
  return next;
}
