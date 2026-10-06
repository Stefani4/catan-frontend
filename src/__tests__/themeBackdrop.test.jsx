import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import ThemeBackdrop from "../components/ThemeBackdrop.jsx";
import Board from "../components/Board.jsx";
import { CATALOG } from "../economy/catalog.js";
import { saveWallet, loadWallet } from "../economy/walletStore.js";
import { credit, purchase, equip } from "../economy/ledger.js";
import { setup } from "../../game/setup.js";

const THEMES = CATALOG.filter((i) => i.category === "boardTheme").map((i) => i.id);
const moving = (c) => c.querySelectorAll(".bd-p").length;

beforeEach(() => localStorage.clear());

describe("<ThemeBackdrop />", () => {
  it("every board theme in the catalog has an animated backdrop (a new theme can't ship plain)", () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(6);
    THEMES.forEach((id) => {
      const { container, unmount } = render(<ThemeBackdrop themeId={id} />);
      const layer = container.querySelector(".bd");
      expect(layer, id).not.toBeNull();
      expect(layer.dataset.theme).toBe(id);
      expect(layer.querySelectorAll("*").length, `${id} should have real content`).toBeGreaterThan(8);
      unmount();
    });
  });

  it("renders nothing for an unknown theme", () => {
    const { container } = render(<ThemeBackdrop themeId="does-not-exist" />);
    expect(container.firstChild).toBeNull();
  });

  it("is purely decorative: hidden from assistive tech", () => {
    const { container } = render(<ThemeBackdrop themeId="volcanic" />);
    expect(container.querySelector(".bd").getAttribute("aria-hidden")).toBe("true");
  });

  it("is deterministic — the same theme renders identical particles every time (no jumping on re-render)", () => {
    const a = render(<ThemeBackdrop themeId="midnight" />).container.innerHTML;
    const b = render(<ThemeBackdrop themeId="midnight" />).container.innerHTML;
    expect(a).toBe(b);
  });

  it("density scales the particle count (shop previews are lighter than the board)", () => {
    THEMES.filter((id) => id !== "seasonal").forEach((id) => {
      const full = moving(render(<ThemeBackdrop themeId={id} density={1} />).container);
      const mini = moving(render(<ThemeBackdrop themeId={id} density={0.3} />).container);
      expect(mini, id).toBeLessThan(full);
      expect(mini, id).toBeGreaterThan(0);
    });
  });

  it("the default theme follows the season, and only that season's particles are drawn", () => {
    const cls = { Spring: ".bd-petal", Summer: ".bd-pollen", Autumn: ".bd-leaf", Winter: ".bd-snow" };
    Object.entries(cls).forEach(([season, sel]) => {
      const { container, unmount } = render(<ThemeBackdrop themeId="seasonal" season={season} />);
      expect(container.querySelectorAll(sel).length, season).toBeGreaterThan(0);
      Object.values(cls).filter((o) => o !== sel).forEach((other) =>
        expect(container.querySelectorAll(other).length, `${season} must not draw ${other}`).toBe(0));
      unmount();
    });
  });

  it("two parchment backdrops on one page don't share an SVG filter id", () => {
    const { container } = render(<><ThemeBackdrop themeId="parchment" /><ThemeBackdrop themeId="parchment" /></>);
    const ids = [...container.querySelectorAll("filter")].map((f) => f.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("<Board /> theme backdrop integration", () => {
  function renderBoard() {
    const G = setup({ ctx: { numPlayers: 2 } }, {});
    G.diceRolled = true;
    const ctx = { currentPlayer: "0", phase: "main", numPlayers: 2 };
    return render(<Board G={G} ctx={ctx} moves={{}} events={{}} playerID="0" matchID="m" bots={[]} />);
  }

  it("draws the equipped theme's backdrop as the FIRST child of the board root, so it sits behind all UI", () => {
    let w = credit(loadWallet(), { amount: 1000, reason: "t" }).wallet;
    w = equip(purchase(w, "midnight").wallet, "midnight").wallet;
    saveWallet(w);

    const { container } = renderBoard();
    const root = container.firstChild;
    const layer = root.querySelector('.bd[data-theme="midnight"]');
    expect(layer).not.toBeNull();
    expect(root.firstChild).toBe(layer); // behind everything else (z-index:-1 inside this stacking context)
    expect(root.style.position).toBe("fixed"); // the root forms the stacking context that contains the layer
  });

  it("the default theme still renders (seasonal particles over the season art)", () => {
    const { container } = renderBoard();
    expect(container.querySelector('.bd[data-theme="seasonal"]')).not.toBeNull();
  });
});
