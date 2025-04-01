import * as PIXI from "pixi.js";

// Cache for loaded textures
const textureCache: { [key: string]: PIXI.Texture } = {};

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
export const loadSprite = async (path: string): Promise<PIXI.Texture> => {
  try {
    // Check cache first
    if (textureCache[path]) {
      return textureCache[path];
    }

    // Load the texture
    const texture = await PIXI.Texture.from(path);
    textureCache[path] = texture;
    return texture;
  } catch (error) {
    console.error(`Failed to load sprite: ${path}`, error);
    return createFallbackTexture();
  }
};

// Preload common sprites
export const preloadSprites = async (onProgress?: (progress: number) => void) => {
  const commonSprites = [
    // Walls and Floors
    "/assets/walls_and_floors/walls_floors.png",
    "/assets/walls_and_floors/mine_breaking_animations.png",
    
    // Doors
    "/assets/doors/mine_doors.png",
    
    // Mining Gems
    "/assets/mining/gems/mining_gems.png",
    "/assets/mining/gems/mining_gems_with_shadows.png",
    "/assets/mining/gems/walls_gems.png",
    
    // Mine Carts
    "/assets/mine_carts/cart_connectors.png",
    "/assets/mine_carts/mine_carts.png",
    "/assets/mine_carts/mine_cart_animation.png",
    
    // Props
    "/assets/props/mine_lamps.png",
    "/assets/props/lamp_animation.png",
    "/assets/props/ladders.png",
    "/assets/props/mine_props.png",
    
    // Character Assets
    "/assets/character/push/clothes/full_body/overhalls/character_push_clothes_fullbody_overhalls_blue.png",
    "/assets/character/push/hairstyles/radical_curve/character_push_hairstyles_radical_curve_black.png"
  ];

  const total = commonSprites.length;
  let loaded = 0;

  // Load sprites sequentially to track progress
  for (const sprite of commonSprites) {
    await loadSprite(sprite);
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
  tileset: {
    firstgid: number;
    source?: string;
    columns?: number;
    image?: string;
    imageheight?: number;
    imagewidth?: number;
    margin?: number;
    name?: string;
    spacing?: number;
    tilecount?: number;
    tileheight?: number;
    tilewidth?: number;
    transparentcolor?: string;
    tiles?: Array<{
      id: number;
      animation?: Array<{
        duration: number;
        tileid: number;
      }>;
    }>;
  }
): PIXI.Texture => {
  const localTileId = tileId - tileset.firstgid;
  const columns = tileset.columns || Math.floor((tileset.imagewidth || 0) / (tileset.tilewidth || 16));
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