import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {characters} from '../characters.mjs';

test('every catalog portrait has a higher-resolution roster image and valid focal crop', async () => {
  for (const c of characters) {
    assert.equal(c.largeImage.split('?')[0], `./assets/fullbody/${c.id}.webp`);
    assert.ok(c.crop && c.crop.width > 0 && c.crop.width <= 2048, c.id);
    assert.ok(c.crop.x >= 0 && c.crop.y >= 0, c.id);
    assert.ok(c.crop.x + c.crop.width <= 2048 && c.crop.y + c.crop.width <= 2048, c.id);
    const image = await readFile(new URL(`../assets/fullbody/${c.id}.webp`, import.meta.url));
    assert.equal(image.toString('ascii',0,4),'RIFF',c.id);
    assert.equal(image.toString('ascii',8,12),'WEBP',c.id);
    assert.ok(image.byteLength > 10000,c.id);
  }
});
