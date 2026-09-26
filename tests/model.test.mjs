import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, setOwned, setLimitBreak, assignSlot, addTeam, exportState, importState, assignedUnitIds } from '../model.mjs';
import { characters } from '../characters.mjs';

test('catalog only contains unique, explicitly confirmed non-gacha units', () => {
  assert.ok(characters.length >= 35);
  assert.equal(new Set(characters.map(c => c.id)).size, characters.length);
  assert.ok(characters.every(c => c.confirmed === true && ['story','star','event','exchange','mission'].includes(c.source)));
  assert.ok(characters.some(c => c.name === 'ロモルド' && c.source === 'event'));
  assert.ok(!characters.some(c => c.name === 'レパント'));
});

test('ownership and 0–6 limit breaks survive JSON round trip', () => {
  let state = setLimitBreak(setOwned(createState(), 'romold', true), 'romold', 6);
  assert.equal(importState(exportState(state)).units.romold.breaks, 6);
  assert.equal(importState(exportState(state)).units.romold.owned, true);
  assert.throws(() => setLimitBreak(state, 'romold', 7));
});

test('assigning a unit to another slot removes it from the first slot', () => {
  let state = assignSlot(createState(), 0, 'front1', 'hisui');
  state = assignSlot(state, 0, 'support', 'hisui');
  assert.equal(state.teams[0].front1, null);
  assert.equal(state.teams[0].support, 'hisui');
  assert.throws(() => assignSlot(state, 0, 'unknown', 'hisui'));
});

test('assigned candidates are unavailable only in the currently selected team', () => {
  let state = addTeam(createState());
  state = assignSlot(state, 0, 'front1', 'hisui');
  state = assignSlot(state, 0, 'support', 'yua');
  assert.deepEqual([...assignedUnitIds(state,0)].sort(), ['hisui','yua']);
  assert.deepEqual([...assignedUnitIds(state,1)], []);
  state = assignSlot(state, 0, 'front1', null);
  assert.deepEqual([...assignedUnitIds(state,0)], ['yua']);
});

test('teams remain independent and imports reject malformed or gacha-only ids without replacing state', () => {
  let state = addTeam(createState());
  state = assignSlot(state, 1, 'back1', 'leona_event');
  assert.equal(state.teams[0].back1, null);
  assert.equal(importState(exportState(state)).teams[1].back1, 'leona_event');
  const corrupted = JSON.parse(exportState(state));
  corrupted.teams[0].front1 = 'gacha_character';
  assert.throws(() => importState(JSON.stringify(corrupted)));
  assert.throws(() => importState('{bad json'));
});
