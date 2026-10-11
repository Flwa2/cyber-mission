import { resolvePlayerAvatar } from "../../utils/playerAvatarResolver.js";
import "./PlayerAvatar.css";

export default function PlayerAvatar({ avatarId, className = "" }) {
  const avatar = resolvePlayerAvatar(avatarId);
  return <span className={`player-avatar ${className}`} aria-hidden="true">
    <img className="player-avatar-art" src={avatar.source} alt="" />
  </span>;
}
