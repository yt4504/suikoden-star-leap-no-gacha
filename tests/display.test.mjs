import test from 'node:test';
import assert from 'node:assert/strict';
import {characters, displayName} from '../characters.mjs';

test('cards show only the character name while distinct versions retain separate identities', () => {
  const hero = characters.filter(c => c.id.startsWith('hero'));
  assert.equal(hero.length, 4);
  assert.deepEqual(hero.map(displayName), ['主人公','主人公','主人公','主人公']);
  assert.equal(new Set(hero.map(c => c.id)).size, 4);
  assert.equal(displayName(characters.find(c => c.id === 'romold')), 'ロモルド');
  assert.equal(displayName(characters.find(c => c.id === 'leona_event')), 'レオナ');
});
