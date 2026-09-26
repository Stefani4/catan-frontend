import { describe, it, expect, afterEach } from "vitest";
import { render } from "@testing-library/react";
import Board from "../components/Board.jsx";
import { setup } from "../../game/setup.js";

function makeG() {
    const G = setup({ ctx: { numPlayers: 2 } }, {});
    G.diceRolled = true;
    return G;
}

function setViewport(width, height) {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
    window.dispatchEvent(new Event("resize"));
}

describe("<Board /> responsive scaling on mobile viewports", () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    afterEach(() => {
        setViewport(originalWidth, originalHeight);
    });

    it("shrinks the board to fit a phone-sized viewport instead of using the fixed desktop budget", () => {
        setViewport(375, 667); // iPhone SE-ish

        const G = makeG();
        const ctx = { currentPlayer: "0", phase: "main", numPlayers: 2 };

        const { container } = render(
            <Board G={G} ctx={ctx} moves={{}} events={{}} playerID="0" matchID="test-match" bots={[]} />,
        );

        const scaledEl = [...container.querySelectorAll("div")].find((el) =>
            el.style.transform?.includes("scale("),
        );
        expect(scaledEl).toBeTruthy();

        const scale = parseFloat(scaledEl.style.transform.match(/scale\(([\d.]+)\)/)[1]);

        // Board is ~550px wide by default; a 375px-wide phone (minus padding)
        // must force a meaningfully smaller scale than the old fixed 620px
        // desktop budget would have allowed (which always resolved to 1).
        expect(scale).toBeLessThan(1);
        expect(scale).toBeGreaterThan(0.3);
    });

    it("uses full scale on a desktop-sized viewport", () => {
        setViewport(1440, 900);

        const G = makeG();
        const ctx = { currentPlayer: "0", phase: "main", numPlayers: 2 };

        const { container } = render(
            <Board G={G} ctx={ctx} moves={{}} events={{}} playerID="0" matchID="test-match" bots={[]} />,
        );

        const scaledEl = [...container.querySelectorAll("div")].find((el) =>
            el.style.transform?.includes("scale("),
        );
        const scale = parseFloat(scaledEl.style.transform.match(/scale\(([\d.]+)\)/)[1]);
        expect(scale).toBe(1);
    });
});
