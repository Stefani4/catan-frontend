import { useState, useEffect } from "react";
import catanLogo from "../images/catanlogo.png";
import createLobbyImg from "../images/lobycreate.png";
import joinLobbyImg from "../images/joinloby.png";
import Settings from "./components/Settings";
import { getThemeImage } from "./theme.js";
import { subscribeToSettings } from "./settingsStore.js";

const TUTORIAL_SEEN_KEY = "catan_tutorial_seen";

export const NAME_KEY = "catan_player_name";

export function getSavedPlayerName() {
    return localStorage.getItem(NAME_KEY) || "Player 1";
}

function ProfileChip() {
    const [name, setName] = useState(getSavedPlayerName());
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        localStorage.setItem(NAME_KEY, name);
    }, [name]);

    return (
        <div
            style={{
                position: "absolute",
                top: "18px",
                left: "18px",
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(20,14,6,0.6)",
                border: "2px solid #c9a96e",
                borderRadius: "999px",
                padding: "6px 16px 6px 6px",
            }}
        >
            <div
                style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #8a5a20, #c9922f)",
                    border: "2px solid #f1d38a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                }}
            >
                👤
            </div>
            {editing ? (
                <input
                    autoFocus
                    value={name}
                    maxLength={20}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setEditing(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
                    style={{
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid #c9a96e",
                        borderRadius: "6px",
                        color: "#f2e6c9",
                        padding: "3px 8px",
                        fontFamily: "Georgia, serif",
                        fontWeight: "bold",
                        width: "120px",
                    }}
                />
            ) : (
                <span
                    onClick={() => setEditing(true)}
                    title="Click to edit your name"
                    style={{
                        color: "#f2e6c9",
                        fontWeight: "bold",
                        fontFamily: "Georgia, serif",
                        cursor: "pointer",
                    }}
                >
          {name} ✎
        </span>
            )}
        </div>
    );
}

function MenuCard({ img, title, description, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                width: "220px",
                padding: "16px",
                borderRadius: "14px",
                border: "3px solid #7a5320",
                background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                cursor: "pointer",
                textAlign: "center",
                transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 14px 26px rgba(0,0,0,0.6)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.5)";
            }}
        >
            <img
                src={img}
                alt={title}
                style={{ width: "90px", height: "90px", objectFit: "contain", margin: "0 auto" }}
            />
            <div
                style={{
                    marginTop: "10px",
                    fontFamily: "Georgia, serif",
                    fontWeight: "bold",
                    fontSize: "1.15rem",
                    color: "#3a2409",
                }}
            >
                {title}
            </div>
            <div
                style={{
                    marginTop: "6px",
                    fontFamily: "Georgia, serif",
                    fontSize: "0.8rem",
                    color: "#5a4326",
                    lineHeight: 1.35,
                }}
            >
                {description}
            </div>
        </div>
    );
}

function FooterButton({ label, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "10px 22px",
                borderRadius: "8px",
                border: "2px solid #c9a96e",
                background: "rgba(20,14,6,0.75)",
                color: "#f2e6c9",
                fontFamily: "Georgia, serif",
                fontWeight: "bold",
                fontSize: "0.9rem",
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}

export default function MainMenu({ onCreateLobby, onJoinLobby }) {
    const [joinCode, setJoinCode] = useState("");
    const [showJoinBox, setShowJoinBox] = useState(false);
    const [infoModal, setInfoModal] = useState(null); // "Tutorial" | "Rules" | "Settings" | null
    const [theme, setTheme] = useState("sunset");

    useEffect(() => subscribeToSettings((s) => setTheme(s.theme)), []);

    // First-run tutorial: pops up once, only if the player hasn't turned
    // "Tutorial Hints" off in Settings and hasn't already dismissed it.
    useEffect(() => {
        return subscribeToSettings((s) => {
            if (s.tutorialHints && !localStorage.getItem(TUTORIAL_SEEN_KEY)) {
                setInfoModal("Tutorial");
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const closeInfoModal = () => {
        if (infoModal === "Tutorial") localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
        setInfoModal(null);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100vw",
                position: "relative",
                backgroundImage: `url(${getThemeImage(theme)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <ProfileChip />

            <img
                src={catanLogo}
                alt="Catan"
                style={{ width: "min(420px, 60vw)", marginBottom: "10px", filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.6))" }}
            />

            <div style={{ display: "flex", gap: "26px", marginTop: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                <MenuCard
                    img={createLobbyImg}
                    title="Create Lobby"
                    description="Create your own game, invite friends and start your journey."
                    onClick={onCreateLobby}
                />
                <MenuCard
                    img={joinLobbyImg}
                    title="Join Lobby"
                    description="Jump into an open lobby and start playing online with other settlers."
                    onClick={() => setShowJoinBox(true)}
                />
            </div>

            {showJoinBox && (
                <div
                    style={{
                        marginTop: "22px",
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        background: "rgba(20,14,6,0.75)",
                        border: "2px solid #c9a96e",
                        borderRadius: "10px",
                        padding: "10px 14px",
                    }}
                >
                    <input
                        autoFocus
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Paste match link or code"
                        style={{
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1px solid #c9a96e",
                            background: "rgba(0,0,0,0.4)",
                            color: "#f2e6c9",
                            fontFamily: "Georgia, serif",
                            width: "240px",
                        }}
                    />
                    <button
                        onClick={() => joinCode.trim() && onJoinLobby(joinCode.trim())}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "2px solid #f1d38a",
                            background: "linear-gradient(135deg, #8a5a20, #c9922f)",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                    >
                        Go
                    </button>
                </div>
            )}

            <div
                style={{
                    position: "absolute",
                    bottom: "22px",
                    display: "flex",
                    gap: "14px",
                }}
            >
                <FooterButton label="Tutorial" onClick={() => setInfoModal("Tutorial")} />
                <FooterButton label="Rules" onClick={() => setInfoModal("Rules")} />
                <FooterButton label="Settings" onClick={() => setInfoModal("Settings")} />
            </div>

            {infoModal === "Settings" && <Settings onClose={() => setInfoModal(null)} />}

            {infoModal && infoModal !== "Settings" && (
                <div
                    onClick={() => setInfoModal(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 50,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                            border: "3px solid #7a5320",
                            borderRadius: "12px",
                            padding: "24px 30px",
                            color: "#3a2409",
                            fontFamily: "Georgia, serif",
                            textAlign: "center",
                            maxWidth: "320px",
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>{infoModal}</h3>
                        <p style={{ fontSize: "0.9rem" }}>Coming soon!</p>
                        <button
                            onClick={() => setInfoModal(null)}
                            style={{
                                marginTop: "8px",
                                padding: "8px 18px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#7a5320",
                                color: "white",
                                fontWeight: "bold",
                                cursor: "pointer",
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
