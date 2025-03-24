// Sprite sheet definitions and utilities for PixiJS
export interface SpritePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteSheet {
  url: string;
  spriteWidth: number;
  spriteHeight: number;
  sprites: Record<string, SpritePosition>;
}

// Store the sprite sheets with a placeholder URL
// We'll use direct drawing with PixiJS instead of image loading
const SPRITE_SHEET_URL = '/placeholder.svg';

// Keep the sprite definitions for future reference
// but we'll actually use PixiJS Graphics for now
export const floorSprites: SpriteSheet = {
  url: SPRITE_SHEET_URL,
  spriteWidth: 32,
  spriteHeight: 32,
  sprites: {
    // Blue floor variants
    'floor-blue-1': { x: 16, y: 112, width: 32, height: 32 },
    'floor-blue-2': { x: 48, y: 96, width: 32, height: 32 },
    'floor-blue-3': { x: 96, y: 64, width: 32, height: 32 },
    'floor-blue-4': { x: 128, y: 64, width: 32, height: 32 },
    
    // Brown/orange floor variants
    'floor-brown-1': { x: 16, y: 272, width: 32, height: 32 },
    'floor-brown-2': { x: 48, y: 256, width: 32, height: 32 },
    'floor-brown-3': { x: 96, y: 224, width: 32, height: 32 },
    'floor-brown-4': { x: 128, y: 224, width: 32, height: 32 },
    
    // Green floor variants
    'floor-green-1': { x: 16, y: 432, width: 32, height: 32 },
    'floor-green-2': { x: 48, y: 416, width: 32, height: 32 },
    'floor-green-3': { x: 96, y: 384, width: 32, height: 32 },
    'floor-green-4': { x: 128, y: 384, width: 32, height: 32 },
    
    // Gray floor variants
    'floor-gray-1': { x: 16, y: 592, width: 32, height: 32 },
    'floor-gray-2': { x: 48, y: 576, width: 32, height: 32 },
    'floor-gray-3': { x: 96, y: 544, width: 32, height: 32 },
    'floor-gray-4': { x: 128, y: 544, width: 32, height: 32 },
  }
};

export const wallSprites: SpriteSheet = {
  url: SPRITE_SHEET_URL,
  spriteWidth: 32,
  spriteHeight: 32,
  sprites: {
    // Blue wall variants
    'wall-blue-center': { x: 48, y: 48, width: 32, height: 32 },
    'wall-blue-horizontal': { x: 16, y: 80, width: 32, height: 32 },
    'wall-blue-vertical': { x: 48, y: 16, width: 16, height: 32 },
    'wall-blue-corner': { x: 16, y: 16, width: 32, height: 48 },
    
    // Brown wall variants
    'wall-brown-center': { x: 48, y: 208, width: 32, height: 32 },
    'wall-brown-horizontal': { x: 16, y: 240, width: 32, height: 32 },
    'wall-brown-vertical': { x: 48, y: 176, width: 16, height: 32 },
    'wall-brown-corner': { x: 16, y: 176, width: 32, height: 48 },
    
    // Green wall variants
    'wall-green-center': { x: 48, y: 368, width: 32, height: 32 },
    'wall-green-horizontal': { x: 16, y: 400, width: 32, height: 32 },
    'wall-green-vertical': { x: 48, y: 336, width: 16, height: 32 },
    'wall-green-corner': { x: 16, y: 336, width: 32, height: 48 },
    
    // Gray wall variants
    'wall-gray-center': { x: 48, y: 528, width: 32, height: 32 },
    'wall-gray-horizontal': { x: 16, y: 560, width: 32, height: 32 },
    'wall-gray-vertical': { x: 48, y: 496, width: 16, height: 32 },
    'wall-gray-corner': { x: 16, y: 496, width: 32, height: 48 },
  }
};

export const minerSprites: SpriteSheet = {
  url: SPRITE_SHEET_URL,
  spriteWidth: 32,
  spriteHeight: 48,
  sprites: {
    'basic-idle': { x: 0, y: 0, width: 32, height: 48 },
    'basic-walk-1': { x: 32, y: 0, width: 32, height: 48 },
    'basic-walk-2': { x: 64, y: 0, width: 32, height: 48 },
    'basic-mine-1': { x: 96, y: 0, width: 32, height: 48 },
    'basic-mine-2': { x: 128, y: 0, width: 32, height: 48 },
  }
};

export const oreNodes: SpriteSheet = {
  url: SPRITE_SHEET_URL,
  spriteWidth: 32,
  spriteHeight: 32,
  sprites: {
    // Gray/stone ores (top right)
    'coal-small': { x: 560, y: 32, width: 16, height: 16 },
    'coal-medium': { x: 544, y: 32, width: 16, height: 16 },
    'coal-large': { x: 528, y: 32, width: 32, height: 32 },
    
    // Green ores
    'copper-small': { x: 560, y: 96, width: 16, height: 16 },
    'copper-medium': { x: 544, y: 96, width: 16, height: 16 },
    'copper-large': { x: 528, y: 96, width: 32, height: 32 },
    
    // Blue ores
    'iron-small': { x: 560, y: 160, width: 16, height: 16 },
    'iron-medium': { x: 544, y: 160, width: 16, height: 16 },
    'iron-large': { x: 528, y: 160, width: 32, height: 32 },
    
    // Red ores
    'gold-small': { x: 560, y: 224, width: 16, height: 16 },
    'gold-medium': { x: 544, y: 224, width: 16, height: 16 },
    'gold-large': { x: 528, y: 224, width: 32, height: 32 },
    
    // Yellow ores
    'crystal-small': { x: 560, y: 288, width: 16, height: 16 },
    'crystal-medium': { x: 544, y: 288, width: 16, height: 16 },
    'crystal-large': { x: 528, y: 288, width: 32, height: 32 },
  }
};

export const propSprites: SpriteSheet = {
  url: SPRITE_SHEET_URL,
  spriteWidth: 32,
  spriteHeight: 32,
  sprites: {
    'mining-cart': { x: 0, y: 0, width: 32, height: 32 },
    'mining-crate': { x: 32, y: 0, width: 32, height: 32 },
    'mining-light': { x: 64, y: 0, width: 32, height: 32 },
    'mining-drill': { x: 96, y: 0, width: 32, height: 32 },
  }
};

export const trackSprites: SpriteSheet = {
  url: SPRITE_SHEET_URL,
  spriteWidth: 32,
  spriteHeight: 32,
  sprites: {
    'track-horizontal': { x: 0, y: 0, width: 32, height: 16 },
    'track-vertical': { x: 32, y: 0, width: 16, height: 32 },
    'track-corner-tl': { x: 48, y: 0, width: 32, height: 32 },
    'track-corner-tr': { x: 80, y: 0, width: 32, height: 32 },
    'track-corner-bl': { x: 112, y: 0, width: 32, height: 32 },
    'track-corner-br': { x: 144, y: 0, width: 32, height: 32 },
  }
};

// Map ore types to sprite names (keeping for reference)
export const oreTypeToSprite: Record<string, string> = {
  'coal': 'coal-medium',
  'iron': 'iron-medium',
  'copper': 'copper-medium',
  'gold': 'gold-medium',
  'crystal': 'crystal-medium',
  'gem': 'crystal-medium', // Use crystal as fallback
  'legendary': 'gold-large', // Use gold as fallback
  'tin': 'coal-medium', // Use coal as fallback
  'silver': 'iron-medium', // Use iron as fallback
  'mithril': 'copper-medium', // Use copper as fallback
  'thorium': 'copper-large', // Use copper as fallback
  'platinum': 'iron-large', // Use iron as fallback
  'orichalcum': 'gold-medium', // Use gold as fallback
  'uranium': 'crystal-medium', // Use crystal as fallback
};

// Get available floor tiles by theme
export const getFloorTilesByTheme = (theme: 'blue' | 'brown' | 'green' | 'gray' = 'blue'): string[] => {
  return [
    `floor-${theme}-1`,
    `floor-${theme}-2`,
    `floor-${theme}-3`,
    `floor-${theme}-4`,
  ];
};

// Helper function to get a random floor tile with theme support
export const getRandomFloorTile = (theme: 'blue' | 'brown' | 'green' | 'gray' = 'blue'): string => {
  const floorTiles = getFloorTilesByTheme(theme);
  return floorTiles[Math.floor(Math.random() * floorTiles.length)];
};

// This function is converted to a no-op as we're using PixiJS now
export const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  spriteName: string,
  x: number,
  y: number,
  width: number = sheet.spriteWidth,
  height: number = sheet.spriteHeight,
  flipX: boolean = false
) => {
  console.log(`[PixiJS] Sprite ${spriteName} would be drawn at ${x},${y}`);
};

// Helper to get the appropriate miner sprite based on state and animation frame
export const getMinerSprite = (miner: any, frameCount: number): string => {
  const animationFrame = Math.floor(frameCount / 10) % 2 + 1; // Alternates between 1 and 2
  
  switch (miner.state) {
    case 'mining':
      return `basic-mine-${animationFrame}`;
    case 'moving':
    case 'returning':
      return `basic-walk-${animationFrame}`;
    case 'seeking':
    default:
      return 'basic-idle';
  }
};
