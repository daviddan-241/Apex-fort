import { useGameStore } from "@/store/gameStore";
import MainMenu from "@/screens/MainMenu";
import CharacterSelect from "@/screens/CharacterSelect";
import GameScene from "@/game/GameScene";
import VictoryScreen from "@/screens/VictoryScreen";
import DefeatScreen from "@/screens/DefeatScreen";

export default function App() {
  const phase = useGameStore(s => s.phase);

  return (
    <div className="game-container">
      {phase === "MENU" && <MainMenu />}
      {phase === "CHARACTER_SELECT" && <CharacterSelect />}
      {phase === "PLAYING" && <GameScene />}
      {phase === "VICTORY" && <VictoryScreen />}
      {phase === "DEFEAT" && <DefeatScreen />}
    </div>
  );
}
