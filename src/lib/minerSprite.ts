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
import { GameState } from "@/interfaces/GameType";
import { MapPosition } from "@/interfaces/MapTypes";
import { getMinerDirection } from "./minerMovement";
import { AnimatedSprite, CustomGraphics } from "@/interfaces/PixiTypes";
import { Ore } from "@/interfaces/OreTypes";
import { minerSprites } from "./mapLogic";

// Create a pulsing glow effect
const createPulseEffect = (): CustomGraphics => {
  const glow = new PIXI.Graphics() as CustomGraphics;
  glow.name = "pulse-glow";
  glow.userData = { countFrame: 0 };

  // Create a gradient fill
  const gradient = new PIXI.Graphics();
  gradient.beginFill(0xffffff, 0.4);
  gradient.drawCircle(0, 0, 20);
  gradient.endFill();

  // Add blur filter for glow effect
  const blurFilter = new PIXI.BlurFilter(4, 4);
  glow.filters = [blurFilter];

  // Add the gradient to the glow
  glow.addChild(gradient);

  return glow;
};

export const createMinerSprite = (miner: Miner, ores: Ore[]): PIXI.Sprite => {
  const animationType = getMinerAnimationType(miner, ores);
  const spriteName = SpriteName.CharacterWalkBodyLight;
  const spriteData = Sprites.find((s) => s.name === spriteName);
  if (!spriteData) return null;

  const animationData = spriteData.animations[animationType];
  if (!animationData) return null;

  const sprite = new PIXI.Sprite();
  sprite.name = `miner-${miner.id}`;

  if (!miner.isBot) {
    sprite.zIndex = 1000;
  }
  console.log(sprite.zIndex);

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

  // Add highlight effect for manual miner (non-bot)
  if (!miner.isBot) {
    const glow = createPulseEffect();
    glow.x = sprite.width / 2;
    glow.y = InitialTileWidth / 2; // Position above the miner's head
    sprite.addChild(glow);
  }

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

  // Update pulse effect for manual miner
  if (!miner.isBot) {
    const glow = sprite.getChildByName("pulse-glow") as CustomGraphics;
    if (glow) {
      // Update frame counter for pulse animation
      glow.userData.countFrame += deltaTime;

      // Create a smoother pulsing effect with wider scale range
      const progress = (glow.userData.countFrame * 0.0005) % 1;
      const easeInOut =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Wider scale range (0.5 to 2.0)
      const pulseScale = 0.5 + easeInOut * 1.5;
      glow.scale.set(pulseScale);

      // Smoother alpha transition
      const alphaProgress = (glow.userData.countFrame * 0.0004) % 1;
      const alphaEase =
        alphaProgress < 0.5
          ? 2 * alphaProgress * alphaProgress
          : 1 - Math.pow(-2 * alphaProgress + 2, 2) / 2;

      glow.alpha = 0.3 + alphaEase * 0.5;
    }
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
        gameState.mapLayerType[i][j] === LayerName.Floor &&
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
