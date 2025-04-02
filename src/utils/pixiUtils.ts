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

export const createBaseSprite = (
  config: BaseSpriteConfig,
  onBaseClick: () => void,
  isBlackout: boolean
): PIXI.Sprite => {
  const baseSprite = new PIXI.Container();
  baseSprite.x = config.x;
  baseSprite.y = config.y;
  baseSprite.width = config.width;
  baseSprite.height = config.height;
  baseSprite.eventMode = "static";
  baseSprite.cursor = "pointer";

  // Add background rectangle
  const baseBg = new PIXI.Graphics();
  baseBg.beginFill(config.backgroundColor, config.backgroundAlpha);
  baseBg.drawRoundedRect(
    -config.width / 2,
    -config.height / 2,
    config.width * 2,
    config.height,
    4
  );
  baseBg.endFill();
  baseSprite.addChild(baseBg);

  // Add border rectangle
  const baseBorder = new PIXI.Graphics();
  baseBorder.lineStyle(1, config.borderColor);
  baseBorder.drawRoundedRect(
    -config.width / 2,
    -config.height / 2,
    config.width * 2,
    config.height,
    4
  );
  baseSprite.addChild(baseBorder);

  // Add text
  const baseText = new PIXI.Text("BASE", {
    fontFamily: "Arial",
    fontSize: config.fontSize,
    fill: config.textColor,
    align: "left",
    fontWeight: "bold",
  });
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

  return baseSprite as PIXI.Sprite;
};

export const createOreSprite = (
  ore: Ore,
  onOreClick: (ore: Ore) => void,
  isBlackout: boolean
): PIXI.Sprite => {
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

  // Add regeneration timer text
  const timerText = new PIXI.Text("", {
    fontSize: 12,
    fill: 0xffffff,
    align: "center",
  });
  timerText.name = "timer-text";
  timerText.anchor.set(0.5, -1);
  timerText.y = -10;
  oreSprite.addChild(timerText);

  return oreSprite;
};

// Create miner sprite with animation
export const createMinerSprite = (miner: Miner): PIXI.Sprite => {
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

  // Add animation data
  const animationData = characterTileset.tiles?.find(
    (t) => t.id === 24
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

  return minerSprite;
};
