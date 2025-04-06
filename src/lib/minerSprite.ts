import * as PIXI from "pixi.js";
import { Miner } from "@/interfaces/MinerTypes";
import { getMinerAnimationType } from "./minersLogic";
import {
  InitialTileWidth,
  LayerName,
  SpriteName,
  Sprites,
} from "@/constants/Sprites";
import { createMinerTilesetTexture } from "@/utils/spriteLoader";
import { MapLayerType, minerSprites } from "./mapLogic";
import { GameState } from "@/interfaces/GameType";
import { MapPosition } from "@/interfaces/MapTypes";

export const createMinerSprite = (miner: Miner): PIXI.Sprite => {
  const animationType = getMinerAnimationType(miner);
  const spriteName = SpriteName.CharacterPushBodyGreen;
  const spriteData = Sprites.find((s) => s.name === spriteName);
  if (!spriteData) return null;

  const animationData = spriteData.animations[animationType];
  if (!animationData) return null;

  const sprite = new PIXI.Sprite();
  sprite.name = `miner-${miner.id}`;

  // Set initial position
  sprite.x =
    (miner.movement.currentTilePos.x + miner.movement.moveProgress) *
    InitialTileWidth;
  sprite.y =
    (miner.movement.currentTilePos.y + miner.movement.moveProgress) *
    InitialTileWidth;

  // Set initial texture
  const texture = createMinerTilesetTexture(
    SpriteName.CharacterPushBodyGreen,
    animationData.frames[0]
  );
  sprite.texture = texture;

  // Store animation data
  minerSprites.set(miner.id, {
    sprite,
    animationType,
    frame: 0,
    time: 0,
  });

  return sprite;
};

export const getAvailableMinerPositions = (
  gameState: GameState
): MapPosition[] => {
  const dimH = gameState.mapDimensions.height;
  const dimW = gameState.mapDimensions.width;
  const miners = gameState.miners;
  const availableTiles: MapPosition[] = [];
  for (let i = 0; i < dimH; i++) {
    for (let j = 0; j < dimW; j++) {
      if (
        MapLayerType[i][j] === LayerName.Floor &&
        !miners.some(
          (miner) =>
            miner.movement.currentTilePos.x === i &&
            miner.movement.currentTilePos.y === j
        )
      ) {
        availableTiles.push({ x: j, y: i });
      }
    }
  }
  return availableTiles;
};
