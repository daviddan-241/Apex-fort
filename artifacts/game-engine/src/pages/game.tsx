import { useEffect } from 'react';
import { GameEngine } from '@/components/game/GameEngine';
import { HUD } from '@/components/game/HUD';
import { AIUpgradePanel } from '@/components/game/AIUpgradePanel';
import { AssetUploader } from '@/components/game/AssetUploader';
import { GameModeManager } from '@/components/game/GameModeManager';
import { TouchControls } from '@/components/game/TouchControls';
import { Navbar } from '@/components/layout/Navbar';
import { useGetConfig } from '@workspace/api-client-react';
import { useGameStore } from '@/store/gameStore';

const isMobile = () =>
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
  navigator.maxTouchPoints > 1;

export default function GamePage() {
  const { data: config } = useGetConfig();
  const setEngineConfig = useGameStore((s) => s.setEngineConfig);

  useEffect(() => {
    if (config) setEngineConfig(config);
  }, [config, setEngineConfig]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#060810] text-white" style={{ touchAction: 'none' }}>

      {/* 3D canvas — fills entire screen */}
      <div className="absolute inset-0 z-0">
        <GameEngine />
      </div>

      {/* Navbar */}
      <div className="absolute top-0 left-0 w-full z-10 pointer-events-auto">
        <Navbar />
      </div>

      {/* HUD overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none pt-14">
        <HUD />
      </div>

      {/* Game mode announcements */}
      <div className="absolute inset-0 z-[25] pointer-events-none pt-14">
        <GameModeManager />
      </div>

      {/* Touch controls — mobile only */}
      {isMobile() && (
        <div className="absolute inset-0 z-[28] pt-14">
          <TouchControls />
        </div>
      )}

      {/* AI Chat panel */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <AIUpgradePanel />
      </div>

      {/* UE5 Asset uploader panel */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <AssetUploader />
        </div>
      </div>
    </div>
  );
}
