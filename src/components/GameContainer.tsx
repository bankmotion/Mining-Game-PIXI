import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGameState } from "@/hooks/useGameState";
import { ResourceBar } from "./ResourceBar";
import { UpgradeShop } from "./UpgradeShop";
import { HiringStation } from "./HiringStation";
import { MineSelector } from "./MineSelector";
import {
  Maximize,
  Play,
  Pause,
  Settings,
  ShoppingBag,
  User,
  Map,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { IncomeForecast } from "./IncomeForecast";
import { toast } from "sonner";
import { PixiMiningArea } from "./PixiMiningArea";
import { EnergyManagement } from "./EnergyManagement";

export const GameContainer = () => {
  const {
    gameState,
    updateGameState,
    isPaused,
    togglePause,
    buyUpgrade,
    hireMiner,
    unlockNewMine,
    switchMine,
    handleOreClick,
    handleBaseClick,
    buildNewEnergySource,
    upgradeExistingEnergySource,
  } = useGameState();

  const [activePanel, setActivePanel] = useState<
    "none" | "upgrades" | "hiring" | "mines" | "energy"
  >("none");

  // Ensure game is properly initialized
  useEffect(() => {
    if (gameState.miners.length === 0 && gameState.ores.length === 0) {
      toast.info("Game world is initializing...");
    }
  }, [gameState.miners.length, gameState.ores.length]);

  // Handle fullscreen toggling
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
        toast.error("Could not enter fullscreen mode");
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <header className="glass-panel z-10 p-3 flex justify-between items-center animate-slide-in border-b border-white/10">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold pixel-font">DEFI Miners</h1>
        </div>

        <ResourceBar
          resources={gameState.resources}
          money={gameState.money}
          moneyRate={gameState.moneyRate}
          energy={gameState.energy}
        />

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={togglePause}
                >
                  {isPaused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPaused ? "Resume" : "Pause"} Game</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={toggleFullScreen}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Fullscreen</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Control Panel */}
        <div className="glass-panel p-2 border-r border-white/10 flex flex-col gap-4 items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-md hover:bg-primary/20"
                onClick={() => setActivePanel("energy")}
              >
                <Zap className="h-6 w-6 text-yellow-400" />
                <span className="sr-only">Energy</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="pixel-container glass-panel border-r border-white/10 max-w-xs"
            >
              <div className="h-full overflow-y-auto pb-20">
                <EnergyManagement
                  money={gameState.money}
                  energySources={gameState.energy.energySources}
                  onBuildEnergySource={buildNewEnergySource}
                  onUpgradeEnergySource={upgradeExistingEnergySource}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-md hover:bg-primary/20"
                onClick={() => setActivePanel("upgrades")}
              >
                <ShoppingBag className="h-6 w-6" />
                <span className="sr-only">Upgrades</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="pixel-container glass-panel border-r border-white/10 max-w-xs"
            >
              <div className="h-full overflow-y-auto pb-20">
                <UpgradeShop
                  money={gameState.money}
                  upgradeLevels={gameState.upgrades}
                  onUpgrade={buyUpgrade}
                  energySources={gameState.energy.energySources}
                  onBuildEnergySource={buildNewEnergySource}
                  onUpgradeEnergySource={upgradeExistingEnergySource}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-md hover:bg-primary/20"
                onClick={() => setActivePanel("hiring")}
              >
                <User className="h-6 w-6" />
                <span className="sr-only">Hiring</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="pixel-container glass-panel border-r border-white/10 max-w-xs"
            >
              <div className="h-full overflow-y-auto pb-20">
                <HiringStation
                  money={gameState.money}
                  miners={gameState.miners}
                  onHire={hireMiner}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-md hover:bg-primary/20"
                onClick={() => setActivePanel("mines")}
              >
                <Map className="h-6 w-6" />
                <span className="sr-only">Mines</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="pixel-container glass-panel border-r border-white/10 max-w-xs"
            >
              <div className="h-full overflow-y-auto pb-20">
                <MineSelector
                  mines={gameState.mines}
                  activeMine={gameState.activeMine}
                  money={gameState.money}
                  onUnlock={unlockNewMine}
                  onSwitch={switchMine}
                />
              </div>
            </SheetContent>
          </Sheet>

          <IncomeForecast moneyRate={gameState.moneyRate} />
        </div>

        {/* Main Mining Area - using PixiJS renderer */}
        <div className="flex-1 flex items-center justify-center p-4">
          <PixiMiningArea
            gameState={gameState}
            onOreClick={handleOreClick}
            onBaseClick={handleBaseClick}
            updateGameState={updateGameState}
            isBlackout={gameState.energy.isBlackout}
          />
        </div>
      </div>

      <footer className="glass-panel p-2 text-center text-xs text-muted-foreground border-t border-white/10">
        <p>
          DEFI Miners &copy; {new Date().getFullYear()} - All rights reserved
        </p>
      </footer>
    </div>
  );
};
