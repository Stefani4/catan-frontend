import { useEffect, useState } from "react";
import MatchLoader from "./MatchLoader";
import FpsOverlay from "./components/FpsOverlay.jsx";
import { subscribeToSettings } from "./settingsStore.js";

function App() {
  const [showFps, setShowFps] = useState(false);

  useEffect(() => {
    return subscribeToSettings((settings) => {
      setShowFps(Boolean(settings.showFps));
      document.documentElement.dataset.animations = settings.animations ? "on" : "off";
    });
  }, []);

  return (
      <>
        <MatchLoader />
        <FpsOverlay visible={showFps} />
      </>
  );
}

export default App;
