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
import { getMinerDirection } from "./minerMovement";
import { AnimatedSprite } from "@/interfaces/PixiTypes";
import { Ore } from "@/interfaces/OreTypes";

export const createMinerSprite = (miner: Miner): PIXI.Sprite => {
  const animationType = getMinerAnimationType(miner);
  const spriteName = SpriteName.CharacterWalkBodyLight;
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
    SpriteName.CharacterWalkBodyLight,
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

// Helper function to update miner animation
export const updateMinerAnimation = (
  sprite: AnimatedSprite,
  miner: Miner,
  ores: Ore[],
  deltaTime: number
) => {
  const animationType = getMinerAnimationType(miner, ores);
  const spriteName =
    miner.state === "mining"
      ? miner.isBot
        ? SpriteName.CharacterToolsDrillBodyDark
        : SpriteName.CharacterToolsDrillBodyLight
      : miner.isBot
      ? SpriteName.CharacterWalkBodyDark
      : SpriteName.CharacterWalkBodyLight;

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

  // get direction
  const direction = getMinerDirection(miner);

  // Update position
  sprite.x =
    (miner.movement.currentTilePos.x +
      (direction === "left"
        ? -miner.movement.moveProgress
        : direction === "right"
        ? miner.movement.moveProgress
        : 0)) *
    InitialTileWidth;
  sprite.y =
    (miner.movement.currentTilePos.y +
      (direction === "up"
        ? -miner.movement.moveProgress
        : direction === "down"
        ? miner.movement.moveProgress
        : 0)) *
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
