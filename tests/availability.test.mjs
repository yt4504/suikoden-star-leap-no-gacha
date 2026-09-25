import test from 'node:test';
import assert from 'node:assert/strict';
import {characters} from '../characters.mjs';
import {joinsInFutureUpdate} from '../availability.mjs';

test('currently documented guaranteed recruits are not marked unavailable', () => {
  assert.deepEqual(characters.filter(c=>joinsInFutureUpdate(c.id)).map(c=>c.id),[]);
  for(const id of ['hou_story','veil','saiga','gaur'])
    assert.equal(joinsInFutureUpdate(id),false,id);
});
