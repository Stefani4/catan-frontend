import { useEffect, useState } from "react";
import MatchLoader from "./MatchLoader";
import FpsOverlay from "./components/FpsOverlay.jsx";
import MuteButton from "./components/MuteButton.jsx";
import { subscribeToSettings } from "./settingsStore.js";
import { initAudio, updateAudioSettings, startMusic, startAmbient } from "./audio/soundEngine.js";

function App() {
  const [showFps, setShowFps] = useState(false);

  useEffect(() => {
    return subscribeToSettings((settings) => {
      setShowFps(Boolean(settings.showFps));
      document.documentElement.dataset.animations = settings.animations ? "on" : "off";
    });
  }, []);

  // Background music/ambient run for the lifetime of the app (menu, lobby,
  // and in-game alike) so that adjusting the volume sliders in Settings is
  // always audible immediately, not just while a match is in progress.
  useEffect(() => subscribeToSettings(updateAudioSettings), []);

  // Browsers require a user gesture before audio can play — unlock the
  // (already-suspended) AudioContext on the very first interaction with the
  // page and kick off the background loops right away.
  useEffect(() => {
    const unlock = () => {
      initAudio();
      startMusic();
      startAmbient();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
      <>
        <MatchLoader />
        <FpsOverlay visible={showFps} />
        <MuteButton />
      </>
  );
}

export default App;
