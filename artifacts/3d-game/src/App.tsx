import { useGameStore } from "./store/gameStore";
import MainMenu from "./components/ui/MainMenu";
import CharacterSelect from "./components/ui/CharacterSelect";
import VictoryScreen from "./components/ui/VictoryScreen";
import Game from "./components/game/Game";

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#000" }}>
      {phase === "menu" && <MainMenu />}
      {phase === "character-select" && <CharacterSelect />}
      {phase === "playing" && <Game />}
      {(phase === "victory" || phase === "defeat") && (
        <>
          <Game />
          <VictoryScreen />
        </>
      )}
    </div>
  );
}
