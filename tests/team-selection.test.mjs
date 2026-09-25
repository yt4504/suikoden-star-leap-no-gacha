import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseCandidate, chooseSlot} from '../team-selection.mjs';

test('a selected candidate is placed with one slot tap and selection clears', () => {
  const candidate = chooseCandidate({unitId:null, slot:null}, 'hisui');
  assert.deepEqual(candidate, {selection:{unitId:'hisui',slot:null}, placement:null});
  assert.deepEqual(chooseSlot(candidate.selection, 'front1'), {
    selection:{unitId:null,slot:null}, placement:{unitId:'hisui',slot:'front1'}
  });
});

test('a selected slot accepts a candidate with one tap and selection clears', () => {
  const target = chooseSlot({unitId:null,slot:null}, 'support');
  assert.deepEqual(target, {selection:{unitId:null,slot:'support'}, placement:null});
  assert.deepEqual(chooseCandidate(target.selection, 'yua'), {
    selection:{unitId:null,slot:null}, placement:{unitId:'yua',slot:'support'}
  });
});
