import multiavatar from "@multiavatar/multiavatar/esm";
import { PLAYER_AVATARS, PLAYER_AVATAR_IDS } from "../../../shared/playerAvatars.mjs";

export function resolvePlayerAvatar(avatarId) {
  const avatar = PLAYER_AVATARS[avatarId] || PLAYER_AVATARS[PLAYER_AVATAR_IDS[0]];
  if (avatar.asset) return { type: "image", source: avatar.asset };
  return {
    type: "svg",
    source: `data:image/svg+xml,${encodeURIComponent(multiavatar(avatar.seed))}`
  };
}
