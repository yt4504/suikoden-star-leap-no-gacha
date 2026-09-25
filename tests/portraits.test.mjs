import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {characters} from '../characters.mjs';

test('every listed version has its own valid local portrait', async () => {
  const images = await Promise.all(characters.map(async c => {
    assert.equal(c.image, `./assets/portraits/${c.id}.png`, c.name);
    const bytes = await readFile(new URL(`../assets/portraits/${c.id}.png`, import.meta.url));
    assert.deepEqual([...bytes.subarray(0,8)], [137,80,78,71,13,10,26,10], c.name);
    assert.ok(bytes.readUInt32BE(16) >= 100, c.name);
    return c.image;
  }));
  assert.equal(new Set(images).size, characters.length);
});
