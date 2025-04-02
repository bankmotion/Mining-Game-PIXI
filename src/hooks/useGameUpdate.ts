import { useEffect, useCallback } from "react";
import * as PIXI from "pixi.js";
import { MineMap } from "@/constants/Map";
import { Ore } from "@/interfaces/OreTypes";
import { Miner } from "@/interfaces/MinerTypes";
import { AnimatedSprite } from "@/interfaces/PixiTypes";
import { createMinerTilesetTexture, textureCache } from "@/utils/spriteLoader";
import { OreData } from "@/constants/Ore";
import { MinerAnimations, MinerAnimationType } from "@/constants/Miners";

interface UseGameStateProps {
  appRef: React.RefObject<PIXI.Application>;
  miners: Miner[];
  ores: Ore[];
}

export const useGameUpdate = ({ appRef, miners, ores }: UseGameStateProps) => {
  // Update ore states
  const updateOreStates = useCallback(
    (deltaTime: number) => {
      if (!appRef.current) return;
      const app = appRef.current;
      const gameContainer = app.stage.getChildAt(0) as PIXI.Container;
      if (!gameContainer) return;

      ores.forEach((ore) => {
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
          progressBar.drawRect(0, MineMap.tileheight / 2, MineMap.tilewidth, 2);
          progressBar.endFill();

          // Draw progress (yellow bar) from right to left
          progressBar.beginFill(0xf39c12, 0.8); // Amber color with transparency
          progressBar.drawRect(
            0,
            MineMap.tileheight / 2,
            MineMap.tilewidth * progress,
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
    [appRef, ores]
  );

  // Update miner animations
  const updateMinerAnimations = useCallback(
    (deltaTime: number) => {
      if (!appRef.current) return;
      const app = appRef.current;
      const gameContainer = app.stage.getChildAt(0) as PIXI.Container;
      if (!gameContainer) return;

      const minersContainer = gameContainer.getChildByName("Miners");
      if (!minersContainer) return;

      minersContainer.children.forEach((child) => {
        if (!(child instanceof PIXI.Sprite)) return;

        const minerId = child.name.replace("miner-", "");
        const miner = miners.find((m) => m.id === minerId);
        if (!miner) return;

        // Update position
        updateMinerPosition(child, miner);

        // Update animation
        updateMinerAnimation(child as AnimatedSprite, miner, deltaTime);
      });
    },
    [appRef, miners]
  );

  // Helper function to update miner position
  const updateMinerPosition = (sprite: PIXI.Sprite, miner: Miner) => {
    const tileX = (miner.position.x / 100) * MineMap.width;
    const tileY = (miner.position.y / 100) * MineMap.height;
    sprite.x = tileX * MineMap.tilewidth;
    sprite.y = tileY * MineMap.tileheight;
  };

  // Helper function to determine animation type based on miner state
  const getMinerAnimationType = (miner: Miner): MinerAnimationType => {
    if (miner.state === "mining") return MinerAnimationType.Drilling;
    if (miner.state === "moving" || miner.state === "returning") return MinerAnimationType.WalkingLeft;
    return MinerAnimationType.Standing;
  };

  // Helper function to update miner animation
  const updateMinerAnimation = (sprite: AnimatedSprite, miner: Miner, deltaTime: number) => {
    const animationType = getMinerAnimationType(miner);
    const animationD = MinerAnimations[animationType];
    const characterTileset = MineMap.tilesets.find(
      (ts) => ts.name === animationD.tileName
    );
    if (!characterTileset) return;

    const animationData = characterTileset.tiles?.find(
      (t) => t.id === animationD.animationId
    )?.animation;
    if (!animationData) return;

    // Update animation data if needed
    if (!sprite.userData?.animation || sprite.userData.animationType !== animationType) {
      sprite.userData = {
        frame: 0,
        animationSpeed: animationD.animationSpeed,
        time: 0,
        tileset: characterTileset,
        baseTexture: textureCache[animationD.tileName].baseTexture,
        animation: animationData,
        animationType: animationType,
      };
    }

    // Update animation frame
    sprite.userData.time += deltaTime / 1000;
    if (sprite.userData.time >= sprite.userData.animationSpeed) {
      sprite.userData.time = 0;
      sprite.userData.frame = (sprite.userData.frame + 1) % sprite.userData.animation.length;

      // Update texture
      const frameData = sprite.userData.animation[sprite.userData.frame];
      const tileTexture = createMinerTilesetTexture(
        sprite.userData.baseTexture,
        sprite.userData.tileset.firstgid + frameData.tileid + 1,
        sprite.userData.tileset
      );
      sprite.texture = tileTexture;
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
