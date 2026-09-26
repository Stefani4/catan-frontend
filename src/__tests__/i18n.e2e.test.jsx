import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GameSetupModal from "../GameSetupModal.jsx";
import SidePanel from "../components/SidePanel.jsx";
import MatchLoader from "../MatchLoader.jsx";
import RulesBook from "../components/RulesBook.jsx";
import Tutorial from "../components/Tutorial.jsx";
import Settings from "../components/Settings.jsx";
import MainMenu from "../MainMenu.jsx";
import { saveSettings, loadSettings } from "../settingsStore.js";

function setLanguage(lang) {
  saveSettings({ ...loadSettings(), language: lang });
}

describe("i18n end-to-end: French rendering", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("GameSetupModal renders every label in French, not English", () => {
    setLanguage("Français");

    render(
        <GameSetupModal
            settings={{
              victoryPointsTarget: 10,
              mapType: "standard",
              diceMode: "standard",
              seasonsEnabled: true,
              robberPayToClear: true,
              resortEnabled: true,
            }}
            onChange={() => {}}
        />,
    );

    expect(screen.getByText(/Points de Victoire/i)).toBeInTheDocument();
    expect(screen.getByText(/Forme du Plateau/i)).toBeInTheDocument();
    expect(screen.getByText(/Mécanique de Dés/i)).toBeInTheDocument();
    expect(screen.getByText(/Règles Optionnelles/i)).toBeInTheDocument();
    expect(screen.getByText(/Saisons/i)).toBeInTheDocument();
    expect(screen.getByText(/Deux Dés \(standard\)/i)).toBeInTheDocument();

    // Fail loudly if the English originals are still present anywhere.
    expect(screen.queryByText("VICTORY POINTS")).not.toBeInTheDocument();
    expect(screen.queryByText("BOARD SHAPE")).not.toBeInTheDocument();
    expect(screen.queryByText("Two Dice (standard)")).not.toBeInTheDocument();
  });

  it("SidePanel/Trading incoming-offer banner renders in French", () => {
    setLanguage("Français");

    const G = {
      players: {
        0: { settlements: [], cities: [], resorts: [], resources: {} },
        1: { settlements: [], cities: [], resorts: [], resources: {} },
      },
      activeOffer: {
        from: "1",
        to: "0",
        give: { type: "brick", amount: 2 },
        receive: { type: "ore", amount: 1 },
      },
    };
    const ctx = { currentPlayer: "0" };
    const moves = { acceptTrade: vi.fn(), cancelTrade: vi.fn() };

    render(<SidePanel G={G} ctx={ctx} moves={moves} playerID="0" matchID="test-match" />);

    expect(screen.getByText(/Offre d.Échange/i)).toBeInTheDocument();
    expect(screen.getByText("Accepter")).toBeInTheDocument();
    expect(screen.getByText("Refuser")).toBeInTheDocument();
    expect(screen.queryByText("Accept")).not.toBeInTheDocument();
    expect(screen.queryByText("Decline")).not.toBeInTheDocument();
    expect(screen.queryByText("Incoming Trade!")).not.toBeInTheDocument();
  });

  it("the 'How many settlers?' picker (real MainMenu click-through) renders in French", () => {
    setLanguage("Français");

    render(<MatchLoader />);

    // Same click a real player makes: MainMenu's "Create Lobby" card.
    const createCard = screen.getByText(/Créer une Partie/i);
    fireEvent.click(createCard);

    expect(screen.getByText(/Combien de colons/i)).toBeInTheDocument();
    expect(screen.getByText(/Joueurs dans cette partie/i)).toBeInTheDocument();
    expect(screen.queryByText("How many settlers?")).not.toBeInTheDocument();
    expect(screen.queryByText("Players in this match")).not.toBeInTheDocument();
  });

  it("RulesBook renders the first page's title in French once opened", () => {
    setLanguage("Français");

    render(<RulesBook onClose={() => {}} />);
    fireEvent.click(screen.getByTitle(/open|ouvrir/i) || screen.getByRole("button"));

    // The book opens to a spread showing pages 1 and 2.
    expect(screen.getByText("Objectif du Jeu")).toBeInTheDocument();
    expect(screen.getByText("Le Plateau de Jeu")).toBeInTheDocument();
    expect(screen.queryByText("Objective of the Game")).not.toBeInTheDocument();
  });

  it("Tutorial renders chapter tabs and an interactive message in French", () => {
    setLanguage("Français");

    render(<Tutorial onClose={() => {}} />);

    expect(screen.getByText("Routes")).toBeInTheDocument();
    expect(screen.getByText("Colonies")).toBeInTheDocument();
    expect(screen.getByText("Villes")).toBeInTheDocument();
    expect(screen.queryByText("Roads")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Routes"));
    expect(screen.getByText(/Cliquez sur un chemin en surbrillance/i)).toBeInTheDocument();
  });

  it("changing a Settings toggle never calls setState synchronously during another component's render (regression for the React 'Cannot update a component while rendering' bug)", () => {
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => {
      errors.push(args.join(" "));
      originalError(...args);
    };

    try {
      // MainMenu renders both ProfileChip (subscribed to settings) and the
      // Settings modal together — this is what actually reproduces the bug;
      // Settings in isolation doesn't have another subscriber to collide with.
      render(<MainMenu onCreateLobby={() => {}} onJoinLobby={() => {}} />);
      fireEvent.click(screen.getByText(/^Settings$|^Paramètres$/i));
      const languageSelect = screen.getAllByRole("combobox").find((el) =>
          [...el.options].some((o) => o.value === "Français"),
      );
      fireEvent.change(languageSelect, { target: { value: "Français" } });
    } finally {
      console.error = originalError;
    }

    const renderPhaseViolations = errors.filter((e) =>
        e.includes("Cannot update a component") && e.includes("while rendering"),
    );
    expect(renderPhaseViolations).toEqual([]);
  });
});