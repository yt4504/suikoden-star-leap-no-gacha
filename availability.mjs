// Only add a character here after confirming that its joining episode is
// unavailable in the current game, not merely because of its chapter number.
const futureUpdateIds = new Set();
export const joinsInFutureUpdate = characterId => futureUpdateIds.has(characterId);
