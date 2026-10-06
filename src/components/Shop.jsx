import { useEffect, useState } from "react";
import { useTranslation } from "../i18n.js";
import { CATALOG, CATEGORIES, RARITIES } from "../economy/catalog.js";
import { ACHIEVEMENTS, REWARD_RULES } from "../economy/rewards.js";
import { buyItem, equipItem, subscribeToWallet } from "../economy/walletStore.js";
import { getFrameProps, getSkinFilter } from "../constants/cosmetics.js";
import ThemeBackdrop from "./ThemeBackdrop.jsx";
import { getAvatarById } from "../constants/avatars.jsx";
import { PLAYER_COLORS } from "../constants/playerColors.js";
import redS from "../../images/redS.png";
import redC from "../../images/redC.png";
import redR from "../../images/redR.png";
import fieldsimg from "../../images/field.png";
import forestimg from "../../images/forest.png";
import hillsimg from "../../images/hills.png";

const CATEGORY_ICON = { boardTheme: "🗺️", pieceSkin: "🏠", avatarFrame: "🖼️" };
const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

function ThemePreview({ item }) {
    const bg = item.backdrop || "linear-gradient(135deg, #3d7a4a, #1c3a22)";
    return (
        <div style={{ position: "relative", isolation: "isolate", overflow: "hidden", width: 120, height: 66, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", gap: 2, border: "1px solid rgba(0,0,0,0.4)" }}>
            {/* live, miniature version of the real board backdrop */}
            <ThemeBackdrop themeId={item.id} density={0.3} />
            {[forestimg, fieldsimg, hillsimg].map((img, i) => (
                <div key={i} style={{ position: "relative", width: 34, height: 38, clipPath: HEX_CLIP, backgroundImage: `url(${img})`, backgroundSize: "cover", filter: item.hexFilter !== "none" ? item.hexFilter : undefined }} />
            ))}
        </div>
    );
}

function SkinPreview({ item }) {
    const filter = getSkinFilter(item.id);
    return (
        <div style={{ width: 120, height: 66, borderRadius: 8, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: PLAYER_COLORS[0].soft }}>
            <img src={redS} alt="" style={{ width: 30, height: 30, objectFit: "contain", filter }} />
            <img src={redC} alt="" style={{ width: 32, height: 32, objectFit: "contain", filter }} />
            <img src={redR} alt="" style={{ width: 34, height: 20, objectFit: "fill", filter }} />
        </div>
    );
}

export function FramePreview({ frameId, size = 44, avatarId = "anchor", colorIndex = 0 }) {
    const { style, className } = getFrameProps(frameId);
    const color = PLAYER_COLORS[colorIndex] ?? PLAYER_COLORS[0];
    const Icon = getAvatarById(avatarId).Icon;
    return (
        <div
            className={className}
            style={{
                width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: `radial-gradient(circle at 30% 30%, ${color.soft}, ${color.accent})`,
                border: "2px solid #f1d38a",
                boxSizing: "border-box",
                ...style,
            }}
        >
            <Icon size={Math.round(size * 0.5)} color="#f2e6c9" />
        </div>
    );
}

function Preview({ item }) {
    if (item.category === "boardTheme") return <ThemePreview item={item} />;
    if (item.category === "pieceSkin") return <SkinPreview item={item} />;
    return (
        <div style={{ width: 120, height: 66, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FramePreview frameId={item.id} size={50} />
        </div>
    );
}

function ItemCard({ item, wallet, onMessage }) {
    const { t } = useTranslation();
    const [confirming, setConfirming] = useState(false);
    const owned = wallet.owned.includes(item.id);
    const equipped = wallet.equipped[item.category] === item.id;
    const shortBy = item.price - wallet.balance;
    const rarity = RARITIES[item.rarity];

    useEffect(() => {
        if (!confirming) return undefined;
        const timer = setTimeout(() => setConfirming(false), 3000);
        return () => clearTimeout(timer);
    }, [confirming]);

    const buy = () => {
        if (!confirming) return setConfirming(true);
        setConfirming(false);
        const res = buyItem(item.id);
        onMessage(res.ok ? t("shopBought", { name: t(`shopItem_${item.id}`) }) : t(`shopErr_${res.error}`));
    };
    const equip = () => {
        const res = equipItem(item.id);
        onMessage(res.ok ? t("shopEquipped", { name: t(`shopItem_${item.id}`) }) : t(`shopErr_${res.error}`));
    };

    const btn = (label, onClick, { primary, disabled } = {}) => (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            style={{
                width: "100%", padding: "6px 8px", borderRadius: 8, fontFamily: "Georgia, serif", fontWeight: "bold", fontSize: "0.78rem",
                border: "2px solid #7a5320",
                background: disabled ? "rgba(0,0,0,0.12)" : primary ? "linear-gradient(135deg, #8a5a20, #c9922f)" : "rgba(255,255,255,0.45)",
                color: primary && !disabled ? "#fff" : "#3a2409",
                cursor: disabled ? "default" : "pointer",
            }}
        >
            {label}
        </button>
    );

    return (
        <div
            data-testid={`shop-item-${item.id}`}
            style={{ width: 150, padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.3)", border: `2px solid ${rarity.color}`, display: "flex", flexDirection: "column", gap: 6, alignItems: "center", boxSizing: "border-box" }}
        >
            <Preview item={item} />
            <div style={{ fontWeight: "bold", fontSize: "0.85rem", textAlign: "center" }}>{t(`shopItem_${item.id}`)}</div>
            <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.5px", color: rarity.color, fontWeight: "bold" }}>{t(`rarity_${item.rarity}`)}</div>
            {equipped
                ? btn(`✔ ${t("shopEquippedBtn")}`, undefined, { disabled: true })
                : owned
                    ? btn(t("shopEquip"), equip, { primary: true })
                    : shortBy > 0
                        ? btn(`🪙 ${item.price} · ${t("shopNeedMore", { n: shortBy })}`, undefined, { disabled: true })
                        : btn(confirming ? t("shopConfirm", { price: item.price }) : `🪙 ${item.price} · ${t("shopBuy")}`, buy, { primary: true })}
        </div>
    );
}

export default function Shop({ onClose }) {
    const { t } = useTranslation();
    const [wallet, setWallet] = useState(null);
    const [tab, setTab] = useState("shop");
    const [category, setCategory] = useState("boardTheme");
    const [message, setMessage] = useState("");

    useEffect(() => subscribeToWallet(setWallet), []);
    useEffect(() => {
        if (!message) return undefined;
        const timer = setTimeout(() => setMessage(""), 2500);
        return () => clearTimeout(timer);
    }, [message]);

    if (!wallet) return null;

    const tabBtn = (id, label) => (
        <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
                padding: "6px 12px", borderRadius: 999, fontFamily: "Georgia, serif", fontWeight: "bold", fontSize: "0.78rem", cursor: "pointer",
                border: "2px solid #7a5320",
                background: tab === id ? "linear-gradient(135deg, #8a5a20, #c9922f)" : "rgba(255,255,255,0.4)",
                color: tab === id ? "#fff" : "#3a2409",
            }}
        >
            {label}
        </button>
    );

    const list = (tab === "inventory" ? CATALOG.filter((i) => wallet.owned.includes(i.id)) : CATALOG).filter((i) => i.category === category);
    const history = [...wallet.entries].reverse().slice(0, 30);

    return (
        <div
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}
        >
            <div
                role="dialog"
                aria-label={t("shop")}
                onClick={(e) => e.stopPropagation()}
                style={{
                    // Fixed size: switching tabs must never resize or move the panel.
                    width: "min(760px, 94vw)", height: "640px", maxHeight: "88vh", overflow: "hidden",
                    display: "flex", flexDirection: "column", boxSizing: "border-box",
                    background: "linear-gradient(160deg, #e8d9b0, #d8c391)", border: "3px solid #7a5320", borderRadius: 14,
                    padding: "18px 20px", color: "#3a2409", fontFamily: "Georgia, serif", boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexShrink: 0 }}>
                    <h2 style={{ margin: 0 }}>🛒 {t("shop")}</h2>
                    <div data-testid="wallet-balance" style={{ fontWeight: "bold", fontSize: "1.05rem", background: "rgba(0,0,0,0.12)", padding: "4px 12px", borderRadius: 999 }}>
                        🪙 {wallet.balance}
                    </div>
                    <button type="button" onClick={onClose} style={{ border: "none", background: "#7a5320", color: "#fff", borderRadius: 6, padding: "6px 14px", fontWeight: "bold", cursor: "pointer" }}>
                        {t("close")}
                    </button>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, flexShrink: 0 }}>
                    {tabBtn("shop", t("shopTabShop"))}
                    {tabBtn("inventory", t("shopTabInventory"))}
                    {tabBtn("achievements", t("shopTabAchievements"))}
                    {tabBtn("history", t("shopTabHistory"))}
                </div>

                <div style={{ minHeight: 18, fontSize: "0.8rem", color: "#2e6b3e", fontWeight: "bold", flexShrink: 0 }} role="status">{message}</div>

                <div data-testid="shop-scroll" style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
                    {(tab === "shop" || tab === "inventory") && (
                        <>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                                {CATEGORIES.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCategory(c)}
                                        style={{
                                            padding: "4px 10px", borderRadius: 8, fontFamily: "Georgia, serif", fontSize: "0.75rem", cursor: "pointer",
                                            border: `2px solid ${category === c ? "#7a5320" : "rgba(122,83,32,0.35)"}`,
                                            background: category === c ? "rgba(122,83,32,0.2)" : "transparent", color: "#3a2409", fontWeight: category === c ? "bold" : "normal",
                                        }}
                                    >
                                        {CATEGORY_ICON[c]} {t(`shopCat_${c}`)}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {list.map((item) => (
                                    <ItemCard key={item.id} item={item} wallet={wallet} onMessage={setMessage} />
                                ))}
                            </div>
                            {category === "boardTheme" && <p style={{ fontSize: "0.7rem", color: "#5a4326" }}>{t("shopThemeHint")}</p>}
                            {category !== "boardTheme" && <p style={{ fontSize: "0.7rem", color: "#5a4326" }}>{t("shopVisibleHint")}</p>}
                        </>
                    )}

                    {tab === "achievements" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontSize: "0.72rem", color: "#5a4326" }}>
                                {t("shopEarnHint", { win: REWARD_RULES.win, part: REWARD_RULES.participation, cap: REWARD_RULES.dailyMatchCap })}
                            </div>
                            {ACHIEVEMENTS.map((a) => {
                                const done = wallet.stats.unlocked.includes(a.id);
                                return (
                                    <div key={a.id} data-testid={`ach-${a.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 8, background: done ? "rgba(46,107,62,0.2)" : "rgba(255,255,255,0.3)", border: `1px solid ${done ? "#2e6b3e" : "rgba(122,83,32,0.35)"}` }}>
                                        <div>
                                            <div style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{done ? "🏅" : "🔒"} {t(`ach_${a.id}`)}</div>
                                            <div style={{ fontSize: "0.7rem", color: "#5a4326" }}>{t(`ach_${a.id}_desc`)}</div>
                                        </div>
                                        <div style={{ fontWeight: "bold" }}>+{a.reward} 🪙</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {tab === "history" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {history.length === 0 && <div>{t("shopNoHistory")}</div>}
                            {history.map((e) => (
                                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", padding: "4px 8px", borderBottom: "1px solid rgba(122,83,32,0.25)" }}>
                                <span>
                                    {t(`ledger_${e.reason}`)}
                                    {e.meta?.itemId ? ` — ${t(`shopItem_${e.meta.itemId}`)}` : ""}
                                    {e.meta?.id ? ` — ${t(`ach_${e.meta.id}`)}` : ""}
                                </span>
                                    <span style={{ fontWeight: "bold", color: e.amount > 0 ? "#2e6b3e" : "#8a2020" }}>{e.amount > 0 ? "+" : ""}{e.amount}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}