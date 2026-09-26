import { useEffect, useState } from "react";
import { loadSettings, saveSettings, subscribeToSettings } from "../settingsStore.js";
import { initAudio } from "../audio/soundEngine.js";
import { useTranslation } from "../i18n.js";

export default function MuteButton() {
    const { t } = useTranslation();
    const [muted, setMuted] = useState(() => loadSettings().muted);

    useEffect(() => subscribeToSettings((s) => setMuted(Boolean(s.muted))), []);

    const toggle = () => {
        initAudio();
        const settings = loadSettings();
        saveSettings({ ...settings, muted: !settings.muted });
    };

    return (
        <button
            onClick={toggle}
            title={muted ? t("unmuteTt") : t("muteAllAudioTt")}
            aria-pressed={muted}
            style={{
                position: "fixed",
                top: "8px",
                right: "56px",
                zIndex: 9999,
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: "1px solid rgba(201,169,110,0.6)",
                background: "rgba(0,0,0,0.65)",
                color: muted ? "#e0a05a" : "#f1d38a",
                fontSize: "0.95rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {muted ? "🔇" : "🔊"}
        </button>
    );
}