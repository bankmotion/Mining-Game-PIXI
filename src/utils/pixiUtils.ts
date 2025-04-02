import { MineMap } from "@/constants/Map";
import { AnimatedSprite, BaseSpriteConfig } from "@/interfaces/PixiTypes";
import * as PIXI from "pixi.js";
import {
  createMinerTilesetTexture,
  createTilesetTexture,
  textureCache,
} from "./spriteLoader";
import { Ore } from "@/interfaces/OreTypes";
import { OreData } from "@/constants/Ore";
import { Miner } from "@/interfaces/MinerTypes";
import { MinerAnimations, MinerAnimationType } from "@/constants/Miners";

// Cache for base sprite configurations
const baseSpriteCache = new Map<string, PIXI.Container>();

// Cache for ore sprites
const oreSpriteCache = new Map<string, PIXI.Sprite>();

// Cache for miner sprites
const minerSpriteCache = new Map<string, PIXI.Sprite>();

// Cache for text styles
const textStyles = {
  base: new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 14,
    fill: 0xffffff,
    align: "left",
    fontWeight: "bold",
  }),
  timer: new PIXI.TextStyle({
    fontSize: 12,
    fill: 0xffffff,
    align: "center",
  }),
};

export const createBaseSprite = (
  config: BaseSpriteConfig,
  onBaseClick: () => void,
  isBlackout: boolean
): PIXI.Sprite => {
  const cacheKey = `${config.x}-${config.y}-${config.width}-${config.height}`;

  // Check cache first
  if (baseSpriteCache.has(cacheKey)) {
    const cachedSprite = baseSpriteCache.get(cacheKey)!;
    if (!isBlackout && onBaseClick) {
      cachedSprite.eventMode = "static";
      cachedSprite.cursor = "pointer";
      cachedSprite.removeAllListeners();
      cachedSprite.on("pointerdown", onBaseClick);
    }
    return cachedSprite as PIXI.Sprite;
  }

  const baseSprite = new PIXI.Container();
  baseSprite.x = config.x;
  baseSprite.y = config.y;
  baseSprite.width = config.width;
  baseSprite.height = config.height;
  baseSprite.eventMode = "static";
  baseSprite.cursor = "pointer";

  // Create graphics with optimized settings
  const graphics = new PIXI.Graphics();

  // Draw background with rounded corners
  graphics.beginFill(config.backgroundColor, config.backgroundAlpha);
  graphics.drawRoundedRect(
    -config.width / 2,
    -config.height / 2,
    config.width * 2,
    config.height,
    4
  );
  graphics.endFill();

  // Draw border
  graphics.lineStyle(1, config.borderColor);
  graphics.drawRoundedRect(
    -config.width / 2,
    -config.height / 2,
    config.width * 2,
    config.height,
    4
  );

  baseSprite.addChild(graphics);

  // Add text with cached style
  const baseText = new PIXI.Text("BASE", textStyles.base);
  baseText.anchor.set(0, 0.5);
  baseText.x = -config.width / 2 + 5;
  baseSprite.addChild(baseText);

  // Add glow effect
  const glow = new PIXI.Graphics();
  glow.beginFill(config.glowColor, config.glowAlpha);
  glow.drawCircle(0, 0, config.glowRadius);
  glow.endFill();
  baseSprite.addChildAt(glow, 0);

  if (!isBlackout && onBaseClick) {
    baseSprite.on("pointerdown", onBaseClick);
  }

  // Cache the sprite
  baseSpriteCache.set(cacheKey, baseSprite);

  return baseSprite as PIXI.Sprite;
};

export const createOreSprite = (
  ore: Ore,
  onOreClick: (ore: Ore) => void,
  isBlackout: boolean
): PIXI.Sprite => {
  // Check cache first
  if (oreSpriteCache.has(ore.id)) {
    const cachedSprite = oreSpriteCache.get(ore.id)!;
    cachedSprite.alpha = ore.depleted ? 0.4 : 1;
    if (!isBlackout && onOreClick) {
      cachedSprite.eventMode = "static";
      cachedSprite.cursor = "pointer";
      cachedSprite.removeAllListeners();
      cachedSprite.on("pointerdown", () => onOreClick(ore));
    }
    return cachedSprite;
  }

  const oreTileset = MineMap.tilesets.find((ts) => ts.name === "mining_ores");
  if (!oreTileset) {
    throw new Error("Ore tileset not found");
  }

  const tileTexture = createTilesetTexture(
    textureCache["mining_ores"].baseTexture,
    oreTileset.firstgid +
      24 +
      Object.keys(OreData).findIndex((or) => or === ore.type),
    oreTileset
  );

  const oreSprite = new PIXI.Sprite(tileTexture);
  oreSprite.name = `ore-${ore.id}`;
  oreSprite.x = ore.position.x * MineMap.tilewidth;
  oreSprite.y = ore.position.y * MineMap.tileheight;
  oreSprite.width = MineMap.tilewidth;
  oreSprite.height = MineMap.tileheight;
  oreSprite.eventMode = "static";
  oreSprite.cursor = "pointer";
  oreSprite.alpha = ore.depleted ? 0.4 : 1;

  if (!isBlackout && onOreClick) {
    oreSprite.on("pointerdown", () => onOreClick(ore));
  }

  // Add regeneration timer text with cached style
  const timerText = new PIXI.Text("", textStyles.timer);
  timerText.name = "timer-text";
  timerText.anchor.set(0.5, -1);
  timerText.y = -10;
  oreSprite.addChild(timerText);

  // Cache the sprite
  oreSpriteCache.set(ore.id, oreSprite);

  return oreSprite;
};

export const createMinerSprite = (miner: Miner): PIXI.Sprite => {
  // Check cache first
  if (minerSpriteCache.has(miner.id)) {
    const cachedSprite = minerSpriteCache.get(miner.id)!;
    const tileX = (miner.position.x / 100) * MineMap.width;
    const tileY = (miner.position.y / 100) * MineMap.height;
    cachedSprite.x = tileX * MineMap.tilewidth;
    cachedSprite.y = tileY * MineMap.tileheight;
    return cachedSprite;
  }

  const characterTileset = MineMap.tilesets.find(
    (ts) => ts.name === "character_push_body_green"
  );

  if (!characterTileset) {
    throw new Error("Character tileset not found");
  }

  const tileTexture = createMinerTilesetTexture(
    textureCache["character_push_body_green"].baseTexture,
    characterTileset.firstgid + characterTileset.columns + 1,
    characterTileset
  );

  const minerSprite = new PIXI.Sprite(tileTexture);
  minerSprite.name = `miner-${miner.id}`;

  const tileX = (miner.position.x / 100) * MineMap.width;
  const tileY = (miner.position.y / 100) * MineMap.height;
  minerSprite.x = tileX * MineMap.tilewidth;
  minerSprite.y = tileY * MineMap.tileheight;
  minerSprite.width = MineMap.tilewidth;
  minerSprite.height = MineMap.tileheight;

  // Add animation data with optimized settings
  const animationData = characterTileset.tiles?.find(
    (t) => t.id === MinerAnimations[MinerAnimationType.Standing].animationId
  )?.animation;
  if (animationData) {
    (minerSprite as AnimatedSprite).userData = {
      frame: 0,
      animationSpeed: 0.3,
      time: 0,
      tileset: characterTileset,
      baseTexture: textureCache["character_push_body_green"].baseTexture,
      animation: animationData,
    };
  }

  // Cache the sprite
  minerSpriteCache.set(miner.id, minerSprite);

  return minerSprite;
};

// Cleanup function to clear caches
export const clearSpriteCaches = () => {
  baseSpriteCache.clear();
  oreSpriteCache.clear();
  minerSpriteCache.clear();
};
