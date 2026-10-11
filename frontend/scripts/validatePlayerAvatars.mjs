import assert from "node:assert/strict";
import { resolvePlayerAvatar } from "../src/utils/playerAvatarResolver.js";
import { PLAYER_AVATARS, PLAYER_AVATAR_IDS } from "../../shared/playerAvatars.mjs";

assert.equal(PLAYER_AVATAR_IDS.length, 24);
const outputs = PLAYER_AVATAR_IDS.map(id => {
  assert(PLAYER_AVATARS[id]?.seed, `${id} needs a fixed Multiavatar seed`);
  assert(PLAYER_AVATARS[id].seed.startsWith("cyber-mission-player-"), `${id} must use a curated seed`);
  const avatar = resolvePlayerAvatar(id);
  assert.equal(avatar.type, "svg");
  assert.match(avatar.source, /^data:image\/svg\+xml,/);
  const svg = decodeURIComponent(avatar.source.slice("data:image/svg+xml,".length));
  assert.match(svg, /<svg\b/);
  assert.doesNotMatch(svg, /<(?:image|script)\b|(?:href|src)=["'](?:https?:|\/\/)/i);
  assert.equal(resolvePlayerAvatar(id).source, avatar.source, `${id} must resolve deterministically`);
  return svg;
});
assert.equal(new Set(outputs).size, PLAYER_AVATAR_IDS.length, "all avatar choices must render distinct artwork");
assert.equal(resolvePlayerAvatar("unknown-id").source, resolvePlayerAvatar(PLAYER_AVATAR_IDS[0]).source);
console.log("Player avatar validation passed: 24 fixed, unique local SVG results, with no external image references.");
