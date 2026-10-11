import { useEffect, useRef, useState } from "react";
import { PLAYER_AVATAR_IDS } from "../../../../shared/playerAvatars.mjs";
import CyberMissionBrand from "../../components/CyberMissionBrand/CyberMissionBrand.jsx";
import FullscreenButton from "../../components/FullscreenButton/FullscreenButton.jsx";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar.jsx";
import { useMission } from "../../context/MissionContext.jsx";
import { useTranslation } from "../../locales/LanguageProvider.jsx";
import "./PlayerSetup.css";

export default function PlayerSetup({ mission, onContinue, onBack }) {
  const { t, language } = useTranslation();
  const { setPlayerName, setAvatarId } = useMission();
  const title = useRef(null);
  const playerName = typeof mission.playerName === "string" ? mission.playerName : "";
  const avatarId = PLAYER_AVATAR_IDS.includes(mission.avatarId) ? mission.avatarId : PLAYER_AVATAR_IDS[0];
  const canContinue = playerName.trim().length > 0 && playerName.trim().length <= 40;

  useEffect(() => { title.current?.focus(); }, []);

  function changeAvatar() {
    const currentIndex = PLAYER_AVATAR_IDS.indexOf(avatarId);
    const nextIndex = (currentIndex + 1) % PLAYER_AVATAR_IDS.length;
    setAvatarId(PLAYER_AVATAR_IDS[nextIndex]);
  }

  return <main className="player-setup" aria-labelledby="player-setup-title">
    <header className="player-setup-header">
      <CyberMissionBrand variant="compact" />
      <FullscreenButton />
    </header>
    <div className="player-setup-content">
      <section className="player-setup-intro">
        <p className="player-setup-eyebrow">{t("BEFORE YOU BEGIN")}</p>
        <h1 id="player-setup-title" tabIndex={-1} ref={title}>{t("GET MISSION READY")}</h1>
        <p>{t("Choose your name and avatar, then continue to the mission briefing.")}</p>
      </section>
      <section className="player-setup-identity" aria-label={t("Player identity")}>
        <div className="player-setup-avatar-display">
          <PlayerAvatar avatarId={avatarId} className="player-setup-avatar" />
        </div>
        <button className="player-setup-change-avatar" type="button" onClick={changeAvatar}>
          <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
            <path d="M16.6 7.2A7 7 0 0 0 4.4 5.1L2.8 6.7M2.8 6.7V2.9M2.8 6.7h3.8M3.4 12.8a7 7 0 0 0 12.2 2.1l1.6-1.6m0 0v3.8m0-3.8h-3.8" />
          </svg>
          {t("Change Avatar")}
        </button>
        <p className="player-avatar-credit">Avatars by Multiavatar.com</p>
      </section>
      <div className="player-setup-name">
        <label htmlFor="player-setup-name">{t("Player Name")}</label>
        <input
          id="player-setup-name"
          name="playerName"
          type="text"
          value={playerName}
          onChange={event => setPlayerName(event.target.value)}
          maxLength={40}
          required
          dir={language === "ar" ? "rtl" : "ltr"}
          placeholder={language === "ar" ? "اكتب اسمك" : "Enter your name"}
          autoComplete="off"
        />
      </div>
      <button className="player-setup-continue" type="button" onClick={onContinue} disabled={!canContinue}>{t("CONTINUE")}</button>
      <button className="player-setup-back" type="button" onClick={onBack}><span aria-hidden="true">{t("←")}</span> {t("BACK TO HOME")}</button>
    </div>
  </main>;
}
