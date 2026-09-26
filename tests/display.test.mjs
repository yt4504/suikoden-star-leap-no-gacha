import test from 'node:test';
import assert from 'node:assert/strict';
import {characters, displayName, acquisitionKind, acquisitionLabel} from '../characters.mjs';

test('cards show only the character name while distinct versions retain separate identities', () => {
  const hero = characters.filter(c => c.id.startsWith('hero'));
  assert.equal(hero.length, 4);
  assert.deepEqual(hero.map(displayName), ['主人公','主人公','主人公','主人公']);
  assert.equal(new Set(hero.map(c => c.id)).size, 4);
  assert.equal(displayName(characters.find(c => c.id === 'romold')), 'ロモルド');
  assert.equal(displayName(characters.find(c => c.id === 'leona_event')), 'レオナ');
});

test('all 47 listed 108-star versions and three guaranteed rewards have distinct acquisition labels', () => {
  assert.deepEqual(Object.fromEntries(['star','exchange','event','mission'].map(kind=>[
    kind,characters.filter(c=>acquisitionKind(c)===kind).length
  ])),{star:44,exchange:3,event:2,mission:1});
  assert.equal(acquisitionLabel(characters.find(c=>c.id==='gonoh')),'108星');
  assert.equal(acquisitionLabel(characters.find(c=>c.id==='hero_senkyo')),'コイン交換');
  assert.equal(acquisitionLabel(characters.find(c=>c.id==='hisui_mission')),'ミッション配布');
  assert.equal(acquisitionLabel(characters.find(c=>c.id==='romold')),'イベント限定');
});

test('story Hou has the water and sword attributes of the guaranteed 108-star version', () => {
  const hou=characters.find(c=>c.id==='hou_story');
  assert.equal(hou.element,'水');
  assert.equal(hou.weapon,'剣');
});
