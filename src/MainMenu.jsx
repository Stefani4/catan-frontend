import { useState, useEffect, useRef } from "react";
import catanLogo from "../images/catanlogo.png";
import createLobbyImg from "../images/lobycreate.png";
import joinLobbyImg from "../images/joinloby.png";
import Settings from "./components/Settings";
import RulesBook from "./components/RulesBook";
import Tutorial from "./components/Tutorial";
import { getThemeImage } from "./theme.js";
import { subscribeToSettings } from "./settingsStore.js";
import { loadProfile, saveProfile, subscribeToProfile } from "./profileStore.js";
import { PLAYER_COLORS } from "./constants/playerColors.js";
import { AVATARS, getAvatarById } from "./constants/avatars.jsx";

const TUTORIAL_SEEN_KEY = "catan_tutorial_seen";

export const NAME_KEY = "catan_player_name";

export function getSavedPlayerName() {
    return localStorage.getItem(NAME_KEY) || "Player 1";
}

function ProfileChip() {
    const [profile, setProfile] = useState(loadProfile());
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => subscribeToProfile(setProfile), []);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const color = PLAYER_COLORS[profile.colorIndex] ?? PLAYER_COLORS[0];
    const AvatarIcon = getAvatarById(profile.avatarId).Icon;

    return (
        <div ref={containerRef} style={{ position: "absolute", top: "18px", left: "18px", zIndex: 20 }}>
            <div
                onClick={() => setOpen((o) => !o)}
                title="Click to edit your profile"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(20,14,6,0.6)",
                    border: `2px solid ${open ? color.soft : "#c9a96e"}`,
                    borderRadius: "999px",
                    padding: "6px 16px 6px 6px",
                    cursor: "pointer",
                    userSelect: "none",
                }}
            >
                <div
                    style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 30% 30%, ${color.soft}, ${color.accent})`,
                        border: "2px solid #f1d38a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <AvatarIcon size={18} color="#f2e6c9" />
                </div>
                <span style={{ color: "#f2e6c9", fontWeight: "bold", fontFamily: "Georgia, serif" }}>
                    {profile.name} ✎
                </span>
            </div>

            {open && (
                <ProfileMenu
                    profile={profile}
                    onChange={(partial) => setProfile(saveProfile(partial))}
                />
            )}
        </div>
    );
}

function ProfileMenu({ profile, onChange }) {
    const color = PLAYER_COLORS[profile.colorIndex] ?? PLAYER_COLORS[0];

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                marginTop: "10px",
                width: "280px",
                background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                border: "3px solid #7a5320",
                borderRadius: "14px",
                boxShadow: "0 12px 26px rgba(0,0,0,0.55)",
                padding: "16px",
                fontFamily: "Georgia, serif",
                color: "#3a2409",
            }}
        >
            <div style={{ fontWeight: "bold", fontSize: "0.95rem", marginBottom: "8px" }}>
                Your name
            </div>
            <input
                autoFocus
                value={profile.name}
                maxLength={20}
                onChange={(e) => onChange({ name: e.target.value })}
                style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #7a5320",
                    background: "rgba(255,255,255,0.5)",
                    color: "#3a2409",
                    fontFamily: "Georgia, serif",
                    fontWeight: "bold",
                    marginBottom: "14px",
                }}
            />

            <div style={{ fontWeight: "bold", fontSize: "0.95rem", marginBottom: "8px" }}>
                Piece color
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "8px",
                    marginBottom: "14px",
                }}
            >
                {PLAYER_COLORS.map((c, idx) => (
                    <div
                        key={c.name}
                        onClick={() => onChange({ colorIndex: idx })}
                        title={c.name}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            aspectRatio: "1",
                            borderRadius: "8px",
                            cursor: "pointer",
                            background: `radial-gradient(circle at 30% 30%, ${c.soft}, ${c.accent})`,
                            border: idx === profile.colorIndex ? "3px solid #3a2409" : "2px solid rgba(0,0,0,0.25)",
                            boxShadow: idx === profile.colorIndex ? "0 0 0 2px #f1d38a inset" : "none",
                        }}
                    />
                ))}
            </div>

            <div style={{ fontWeight: "bold", fontSize: "0.95rem", marginBottom: "8px" }}>
                Avatar
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "8px",
                }}
            >
                {AVATARS.map((a) => {
                    const isSelected = a.id === profile.avatarId;
                    return (
                        <div
                            key={a.id}
                            onClick={() => onChange({ avatarId: a.id })}
                            title={a.label}
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                aspectRatio: "1",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: isSelected
                                    ? `radial-gradient(circle at 30% 30%, ${color.soft}, ${color.accent})`
                                    : "rgba(255,255,255,0.4)",
                                border: isSelected ? "3px solid #3a2409" : "2px solid rgba(0,0,0,0.2)",
                            }}
                        >
                            <a.Icon size={18} color={isSelected ? "#f2e6c9" : "#3a2409"} />
                        </div>
                    );
                })}
            </div>
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

            {infoModal === "Rules" && <RulesBook onClose={() => setInfoModal(null)} />}

            {infoModal === "Tutorial" && <Tutorial onClose={closeInfoModal} />}

            {infoModal && infoModal !== "Settings" && infoModal !== "Rules" && infoModal !== "Tutorial" && (
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