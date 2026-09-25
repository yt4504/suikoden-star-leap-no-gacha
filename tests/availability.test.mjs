import test from 'node:test';
import assert from 'node:assert/strict';
import {characters} from '../characters.mjs';
import {joinsLater,storyStageValid} from '../availability.mjs';

test('future joiners fade at the Tenryu fight and become available at their chapter gates', () => {
  const futureAtBoss=['bubu','tsubaki','rachana_story','rihyo','hou_story','veil','saiga','gaur'];
  const futureAfterChapter3=['hou_story','veil','saiga','gaur'];
  assert.deepEqual(characters.filter(c=>joinsLater(c.id,'before_tenryu')).map(c=>c.id).sort(),futureAtBoss.sort());
  assert.deepEqual(characters.filter(c=>joinsLater(c.id,'after_3_3')).map(c=>c.id).sort(),futureAfterChapter3.sort());
  assert.equal(characters.some(c=>joinsLater(c.id,'after_4_0')),false);
  assert.equal(joinsLater('muuser','before_tenryu'),false);
  assert.equal(storyStageValid('before_tenryu'),true);
  assert.equal(storyStageValid('unknown'),false);
});
