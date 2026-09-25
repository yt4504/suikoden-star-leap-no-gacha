const empty = () => ({unitId:null,slot:null});

export function chooseCandidate(selection, unitId) {
  if (selection.slot) return {selection:empty(),placement:{unitId,slot:selection.slot}};
  return {selection:{unitId,slot:null},placement:null};
}

export function chooseSlot(selection, slot) {
  if (selection.unitId) return {selection:empty(),placement:{unitId:selection.unitId,slot}};
  return {selection:{unitId:null,slot},placement:null};
}
