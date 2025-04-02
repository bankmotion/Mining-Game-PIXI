import * as PIXI from "pixi.js";
import { Map, Tileset } from "@/interfaces/MapTypes";

// Cache for loaded textures
export const textureCache: { [key: string]: PIXI.Texture } = {};

// Create a fallback texture (gray rectangle)
const createFallbackTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 16, 16);
  }
  return PIXI.Texture.from(canvas);
};

// Load a sprite texture
export const loadSprite = async (
  path: string,
  name: string
): Promise<PIXI.Texture> => {
  try {
    // Check cache first
    if (textureCache[name]) {
      return textureCache[name];
    }

    // Load the texture
    const texture = await PIXI.Texture.from(path);
    textureCache[name] = texture;
    return texture;
  } catch (error) {
    console.error(`Failed to load sprite: ${path}`, error);
    return createFallbackTexture();
  }
};

// Preload common sprites
export const preloadSprites = async (
  map: Map,
  onProgress?: (progress: number) => void
) => {
  const spritesToLoad: { path: string; name: string }[] = [];

  // Add tileset sprites
  map.tilesets.forEach((tileset: Tileset) => {
    if (tileset.image) {
      spritesToLoad.push({
        path: tileset.image,
        name: tileset.name,
      });
    }
  });
  console.log(spritesToLoad.map((sprite) => sprite.name));

  const total = spritesToLoad.length;
  let loaded = 0;

  // Load sprites sequentially to track progress
  for (const sprite of spritesToLoad) {
    await loadSprite(sprite.path, sprite.name);
    loaded++;
    if (onProgress) {
      onProgress((loaded / total) * 100);
    }
  }
};

// Create a texture from a tileset
export const createTilesetTexture = (
  baseTexture: PIXI.BaseTexture,
  tileId: number,
  tileset: Tileset
): PIXI.Texture => {
  const localTileId = tileId - tileset.firstgid;
  const columns =
    tileset.columns ||
    Math.floor((tileset.imagewidth || 0) / (tileset.tilewidth || 16));
  const tilesetRow = Math.floor(localTileId / columns);
  const tilesetCol = localTileId % columns;

  return new PIXI.Texture(
    baseTexture,
    new PIXI.Rectangle(
      tilesetCol * (tileset.tilewidth || 16),
      tilesetRow * (tileset.tileheight || 16),
      tileset.tilewidth || 16,
      tileset.tileheight || 16
    )
  );
};

// Create a texture from a tileset
export const createMinerTilesetTexture = (
  baseTexture: PIXI.BaseTexture,
  tileId: number,
  tileset: Tileset
): PIXI.Texture => {
  const localTileId = tileId - tileset.firstgid;
  const columns =
    tileset.columns ||
    Math.floor((tileset.imagewidth || 0) / (tileset.tilewidth || 16));
  const tilesetRow = Math.floor(localTileId / columns);
  const tilesetCol = localTileId % columns;

  return new PIXI.Texture(
    baseTexture,
    new PIXI.Rectangle(
      tilesetCol * (tileset.tilewidth || 16) + tileset.tilewidth / 2,
      tilesetRow * (tileset.tileheight || 16) + tileset.tileheight / 2,
      tileset.tilewidth || 16,
      tileset.tileheight || 16
    )
  );
};
