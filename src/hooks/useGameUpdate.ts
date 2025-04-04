import { OreData } from "@/constants/Ore";
import {
  InitialTileWidth,
  LayerName,
  SpriteName,
  Sprites,
} from "@/constants/Sprites";
import { GameState } from "@/interfaces/GameType";
import { MapDimensions } from "@/interfaces/MapTypes";
import { Miner } from "@/interfaces/MinerTypes";
import { Ore } from "@/interfaces/OreTypes";
import { AnimatedSprite } from "@/interfaces/PixiTypes";
import { minerSprites } from "@/lib/mapLogic";
import { getMinerAnimationType } from "@/lib/minersLogic";
import { createMinerTilesetTexture } from "@/utils/spriteLoader";
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

      gameState.ores.forEach((ore) => {
        const oreSprite = gameContainer.getChildByName(
          `ore-${ore.id}`
        ) as PIXI.Sprite;
        if (!oreSprite) return;

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

        // Update position
        updateMinerPosition(child, miner, gameState.mapDimensions);

        // Update animation
        updateMinerAnimation(child as AnimatedSprite, miner, deltaTime);
      });
    },
    [appRef, gameState.miners, gameState.mapDimensions]
  );

  // Helper function to update miner position
  const updateMinerPosition = (
    sprite: PIXI.Sprite,
    miner: Miner,
    dimensions: MapDimensions
  ) => {
    const tileX =
      (miner.position.x / 100) * dimensions.width * InitialTileWidth;
    const tileY =
      (miner.position.y / 100) * dimensions.height * InitialTileWidth;
    sprite.x = tileX * InitialTileWidth;
    sprite.y = tileY * InitialTileWidth;
  };

  // Helper function to update miner animation
  const updateMinerAnimation = (
    sprite: AnimatedSprite,
    miner: Miner,
    deltaTime: number
  ) => {
    const animationType = getMinerAnimationType(miner);
    const spriteName =
      miner.state === "mining"
        ? SpriteName.CharacterToolsDrillBodyGreen
        : SpriteName.CharacterPushBodyGreen;

    const spriteData = Sprites.find((s) => s.name === spriteName);
    if (!spriteData) return;

    const animationData = spriteData.animations[animationType];
    if (!animationData) return;

    // Get or create sprite data from minerSprites Map
    let minerSpriteData = minerSprites.get(miner.id);
    if (!minerSpriteData) {
      minerSpriteData = {
        sprite,
        animationType,
        frame: 0,
        time: 0,
      };
      minerSprites.set(miner.id, minerSpriteData);
    }

    // Update position
    sprite.x =
      (miner.position.x / 100) *
      gameState.mapDimensions.width *
      InitialTileWidth;
    sprite.y =
      (miner.position.y / 100) *
      gameState.mapDimensions.height *
      InitialTileWidth;

    // Update animation if type changed
    if (minerSpriteData.animationType !== animationType) {
      minerSpriteData.animationType = animationType;
      minerSpriteData.frame = 0;
      minerSpriteData.time = 0;

      const texture = createMinerTilesetTexture(
        spriteName,
        animationData.frames[0]
      );
      sprite.texture = texture;
    }

    // Update animation frame
    minerSpriteData.time += deltaTime / 1000;
    if (minerSpriteData.time >= animationData.speed) {
      minerSpriteData.time = 0;
      minerSpriteData.frame =
        (minerSpriteData.frame + 1) % animationData.frames.length;

      const texture = createMinerTilesetTexture(
        spriteName,
        animationData.frames[minerSpriteData.frame]
      );
      sprite.texture = texture;
    }
  };

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
