import { OreData } from "@/constants/Ore";
import {
  InitialTileWidth,
  LayerName
} from "@/constants/Sprites";
import { GameState } from "@/interfaces/GameType";
import { AnimatedSprite } from "@/interfaces/PixiTypes";
import { updateMinerMovement } from "@/lib/minerMovement";
import { updateMinerAnimation } from "@/lib/minersLogic";
import * as PIXI from "pixi.js";
import { useCallback, useEffect } from "react";

interface UseGameStateProps {
  appRef: React.RefObject<PIXI.Application>;
  gameState: GameState;
}

export const useGameUpdate = ({ appRef, gameState }: UseGameStateProps) => {
  // Update ore states
  const updateOreStates = useCallback(
    (deltaTime: number) => {
      if (!appRef.current) return;

      const app = appRef.current;
      const gameContainer = app.stage.getChildAt(0) as PIXI.Container;
      if (!gameContainer) return;

      const oreContainer = gameContainer.getChildByName(
        LayerName.Ore
      ) as PIXI.Container;
      if (!oreContainer) return;

      gameState.ores.forEach((ore) => {
        const oreSprite = oreContainer.getChildByName(
          `ore-${ore.id}`
        ) as PIXI.Sprite;
        if (!oreSprite) return;
        console.log("hello");

        oreSprite.alpha = ore.depleted ? 0.4 : 1;

        // Update regeneration progress bar if depleted
        if (ore.depleted) {
          let progressBar = oreSprite.getChildByName(
            "progress-bar"
          ) as PIXI.Graphics;

          // Create progress bar if it doesn't exist
          if (!progressBar) {
            progressBar = new PIXI.Graphics();
            progressBar.name = "progress-bar";
            progressBar.y = -8; // Position above the ore
            oreSprite.addChild(progressBar);
          }

          // Calculate progress (0 to 1)
          const progress =
            ore.regenerationTime / OreData[ore.type].regenerationTime;

          // Clear previous drawing
          progressBar.clear();

          // Draw background (green bar)
          progressBar.beginFill(0x10b981, 0.3); // Emerald color with transparency
          progressBar.drawRect(0, InitialTileWidth / 2, InitialTileWidth, 2);
          progressBar.endFill();

          // Draw progress (yellow bar) from right to left
          progressBar.beginFill(0xf39c12, 0.8); // Amber color with transparency
          progressBar.drawRect(
            0,
            InitialTileWidth / 2,
            InitialTileWidth * progress,
            2
          );
          progressBar.endFill();
        } else {
          // Remove progress bar if ore is not depleted
          const progressBar = oreSprite.getChildByName("progress-bar");
          if (progressBar) {
            oreSprite.removeChild(progressBar);
          }
        }
      });
    },
    [appRef, gameState.ores]
  );

  // Update miner animations
  const updateMinerAnimations = useCallback(
    (deltaTime: number) => {
      if (!appRef.current) return;
      const app = appRef.current;
      const gameContainer = app.stage.getChildAt(0) as PIXI.Container;
      if (!gameContainer) return;

      const minersContainer = gameContainer.getChildByName(LayerName.Miners);
      if (!minersContainer) return;

      minersContainer.children.forEach((child) => {
        if (!(child instanceof PIXI.Sprite)) return;

        const minerId = child.name.replace("miner-", "");
        const miner = gameState.miners.find((m) => m.id === minerId);
        if (!miner) return;

        updateMinerMovement(miner, deltaTime);

        // Update animation
        updateMinerAnimation(child as AnimatedSprite, miner, deltaTime);
      });
    },
    [appRef, gameState.miners]
  );

  // Update game state
  const updateGame = useCallback(
    (deltaTime: number) => {
      updateOreStates(deltaTime);
      updateMinerAnimations(deltaTime);
    },
    [updateOreStates, updateMinerAnimations]
  );

  // Add game state update ticker
  useEffect(() => {
    if (!appRef.current) return;

    const app = appRef.current;
    const tickerCallback = () => {
      updateGame(app.ticker.deltaMS);
    };
    app.ticker.add(tickerCallback);

    return () => {
      app.ticker.remove(tickerCallback);
    };
  }, [appRef, updateGame]);

  return {
    updateGame,
  };
};
