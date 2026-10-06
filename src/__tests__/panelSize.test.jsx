import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Shop from "../components/Shop.jsx";
import Settings from "../components/Settings.jsx";

beforeEach(() => localStorage.clear());

// jsdom has no layout engine, so this guards the *mechanism* that keeps the
// panels from resizing (a fixed height; maxHeight is only a clamp).
// The real pixel measurements were checked in a browser.
describe("panels keep one fixed size across tabs", () => {
  it("Shop: fixed height, clipped frame, dedicated scroll area, same style on every tab", () => {
    render(<Shop onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    const styleOf = () => dialog.getAttribute("style");
    const initial = styleOf();

    expect(dialog.style.height).toBe("640px"); // fixed, not content-driven
    expect(dialog.style.maxHeight).toBe("88vh"); // only a clamp for short screens
    expect(dialog.style.overflow).toBe("hidden");
    expect(screen.getByTestId("shop-scroll").style.overflowY).toBe("auto");

    ["Inventory", "Achievements", "History", "Shop"].forEach((tab) => {
      fireEvent.click(screen.getByRole("button", { name: tab, exact: true }));
      expect(styleOf()).toBe(initial);
    });
  });

  it("Settings: fixed height (not maxHeight) and unchanged when switching sections", () => {
    const { container } = render(<Settings onClose={() => {}} />);
    const card = container.firstChild.firstChild; // overlay -> card
    expect(card.style.height).toBe("680px"); // fixed, not content-driven
    expect(card.style.maxHeight).toBe("90vh"); // only a clamp for short screens
    const initial = card.getAttribute("style");

    const nav = container.querySelectorAll('div[style*="width: 190px"] button');
    expect(nav.length).toBeGreaterThanOrEqual(5);
    nav.forEach((btn) => {
      fireEvent.click(btn);
      expect(card.getAttribute("style")).toBe(initial);
    });
  });
});
