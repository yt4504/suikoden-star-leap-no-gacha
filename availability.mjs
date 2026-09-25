// Story gates verified against the individual 108-star pages in SOURCES.md.
export const storyStages = Object.freeze([
  ['before_tenryu', '進行：テンリュウ前'],
  ['after_3_3', '進行：3章3話クリア'],
  ['after_4_0', '進行：4章0話クリア'],
]);

const gates = Object.freeze({
  bubu: 'after_3_3',
  tsubaki: 'after_3_3',
  rachana_story: 'after_3_3',
  rihyo: 'after_3_3',
  hou_story: 'after_4_0',
  veil: 'after_4_0',
  saiga: 'after_4_0',
  gaur: 'after_4_0',
});

export const storyStageValid = value => storyStages.some(([id]) => id === value);
export const joinsLater = (characterId, stage) => {
  const gate = gates[characterId];
  return !!gate && storyStages.findIndex(([id]) => id === stage) < storyStages.findIndex(([id]) => id === gate);
};
