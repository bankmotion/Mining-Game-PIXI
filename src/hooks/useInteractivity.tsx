import { useCallback } from "react";
import * as PIXI from "pixi.js";
import { MineMap } from "@/constants/Map";
import { MineTypes } from "@/constants/Mine";
import { Ore } from "@/interfaces/OreTypes";
import { Miner } from "@/interfaces/MinerTypes";
import {
  createBaseSprite,
  createOreSprite,
  createMinerSprite,
} from "@/utils/pixiUtils";

interface UseInteractivityProps {
  appRef: React.RefObject<PIXI.Application>;
  ores: Ore[];
  miners: Miner[];
  activeMine?: string;
  onOreClick?: (ore: Ore) => void;
  onBaseClick?: () => void;
  isBlackout?: boolean;
}

export const useInteractivity = ({
  appRef,
  ores,
  miners,
  activeMine = "starter",
  onOreClick,
  onBaseClick,
  isBlackout = false,
}: UseInteractivityProps) => {
  const setupInteractivity = useCallback(
    (app: PIXI.Application, container: PIXI.Container) => {
      // Get base position from game logic
      const mine = MineTypes.find((m) => m.id === activeMine);
      const basePosition = mine ? mine.basePosition : { x: 0, y: 0 };

      // Create base sprite
      const baseConfig = {
        x: (basePosition.x / 100) * MineMap.width * MineMap.tilewidth,
        y:
          (basePosition.y / 100) * MineMap.height * MineMap.tileheight -
          MineMap.tileheight * 1.5,
        width: MineMap.tilewidth,
        height: MineMap.tileheight,
        backgroundColor: 0x4a5568,
        backgroundAlpha: 0.8,
        borderColor: 0x718096,
        textColor: 0xffffff,
        fontSize: 8,
        glowColor: 0x4a5568,
        glowAlpha: 0.3,
        glowRadius: 16,
      };

      const baseSprite = createBaseSprite(baseConfig, onBaseClick, isBlackout);
      container.addChild(baseSprite);

      // Add ore nodes
      ores.forEach((ore) => {
        const oreSprite = createOreSprite(ore, onOreClick, isBlackout);
        container.addChild(oreSprite);
      });

      // Add a dedicated container for miners
      const minersContainer = new PIXI.Container();
      minersContainer.name = "Miners";
      container.addChild(minersContainer);

      // Render miners in their dedicated container
      miners.forEach((miner) => {
        const minerSprite = createMinerSprite(miner);
        minersContainer.addChild(minerSprite);
      });
    },
    [activeMine, ores, miners, onBaseClick, onOreClick, isBlackout]
  );

  return {
    setupInteractivity,
  };
};
