import { MapTile } from "@/constants/Map";
import { MineTypes } from "@/constants/Mine";
import {
  FloorData,
  InitialTileWidth,
  LayerName,
  MountainData,
  SpriteName,
  Sprites,
} from "@/constants/Sprites";
import {
  MapContainer,
  MapDimensions,
  MapPosition,
  MinerSpriteData,
} from "@/interfaces/MapTypes";
import { Miner } from "@/interfaces/MinerTypes";
import { Ore } from "@/interfaces/OreTypes";
import { createOreSprite } from "@/utils/pixiUtils";
import {
  createMinerTilesetTexture,
  createTilesetTexture,
} from "@/utils/spriteLoader";
import { getRandomTileId } from "@/utils/utils";
import * as PIXI from "pixi.js";
import {
  createMinerAtPositions,
  findValidMinerPositions,
  getMinerAnimationType,
  updateMinerPositions,
} from "./minersLogic";
import { findValidOrePositions, updateOrePositions } from "./oresLogic";

// Constants
export const MapLayerType: LayerName[][] = [];
export const minerSprites = new Map<string, MinerSpriteData>();

// Helper Functions
const createMapContainer = (container: PIXI.Container): MapContainer => {
  const floorContainer = new PIXI.Container();
  floorContainer.name = LayerName.Floor;
  container.addChild(floorContainer);

  const wallContainer = new PIXI.Container();
  wallContainer.name = LayerName.Wall;
  container.addChild(wallContainer);

  const minerContainer = new PIXI.Container();
  minerContainer.name = LayerName.Miners;
  container.addChild(minerContainer);

  const oreContainer = new PIXI.Container();
  oreContainer.name = LayerName.Ore;
  container.addChild(oreContainer);

  return {
    floor: floorContainer,
    wall: wallContainer,
    miner: minerContainer,
    ore: oreContainer,
  };
};

const calculateMapCenter = (dimensions: MapDimensions): MapPosition => ({
  x: Math.floor(dimensions.width / 2),
  y: Math.floor(dimensions.height / 2),
});

// New function to generate a more natural cave shape
const generateCaveShape = (
  width: number,
  height: number,
  roughness: number = 0.3
): boolean[][] => {
  const shape: boolean[][] = Array(height)
    .fill(0)
    .map(() => Array(width).fill(false));

  // Start with a basic ellipse
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;

  // Add some random variation to the shape
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate distance from center
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Add some noise to the distance
      const noise = (Math.random() - 0.5) * roughness;
      const adjustedDistance = distance + noise;

      // If within the adjusted radius, mark as floor
      if (adjustedDistance <= 1) {
        shape[y][x] = true;
      }
    }
  }

  // Smooth the edges
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (shape[y][x]) {
        // Count adjacent floor tiles
        let floorCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (shape[y + dy][x + dx]) floorCount++;
          }
        }
        // If too isolated, convert to wall
        if (floorCount < 4) shape[y][x] = false;
      }
    }
  }

  return shape;
};

const calculateAvailableAreaBounds = (
  center: MapPosition,
  availableArea: MapDimensions
): { start: MapPosition; end: MapPosition; shape: boolean[][] } => {
  const startX = center.x - Math.floor(availableArea.width / 2);
  const startY = center.y - Math.floor(availableArea.height / 2);
  const endX = startX + availableArea.width;
  const endY = startY + availableArea.height;

  // Generate the cave shape
  const shape = generateCaveShape(
    availableArea.width,
    availableArea.height,
    0.2
  );

  return {
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    shape,
  };
};

const isPositionInBounds = (
  pos: MapPosition,
  dimensions: MapDimensions
): boolean => {
  return (
    pos.x >= 0 &&
    pos.x < dimensions.width &&
    pos.y >= 0 &&
    pos.y < dimensions.height
  );
};

const isPositionInAvailableArea = (
  pos: MapPosition,
  bounds: { start: MapPosition; end: MapPosition; shape: boolean[][] }
): boolean => {
  const relativeX = pos.x - bounds.start.x;
  const relativeY = pos.y - bounds.start.y;

  // Check if position is within the bounds and part of the cave shape
  return (
    pos.x >= bounds.start.x &&
    pos.x < bounds.end.x &&
    pos.y >= bounds.start.y &&
    pos.y < bounds.end.y &&
    bounds.shape[relativeY]?.[relativeX] === true
  );
};

// Core Functions
export const updateMapType = (
  container: PIXI.Container<PIXI.DisplayObject>,
  position: MapPosition,
  spriteName: SpriteName,
  id: number,
  mapType: LayerName
): void => {
  const tileTexture = createTilesetTexture(spriteName, id);
  const tile = new PIXI.Sprite(tileTexture);

  tile.x = position.x * MapTile.width;
  tile.y = position.y * MapTile.height;
  container.addChild(tile);

  if (!MapLayerType[position.y]) {
    MapLayerType[position.y] = [];
  }
  MapLayerType[position.y][position.x] = mapType;
};

const createFloorTiles = (
  containers: MapContainer,
  bounds: { start: MapPosition; end: MapPosition; shape: boolean[][] },
  dimensions: MapDimensions
): void => {
  for (let y = bounds.start.y; y < bounds.end.y; y++) {
    for (let x = bounds.start.x; x < bounds.end.x; x++) {
      const position = { x, y };
      if (!isPositionInBounds(position, dimensions)) continue;

      const relativeX = x - bounds.start.x;
      const relativeY = y - bounds.start.y;

      // Only create floor tiles where the shape is true
      if (bounds.shape[relativeY]?.[relativeX]) {
        const id = getRandomTileId(FloorData);
        updateMapType(
          containers.floor,
          position,
          SpriteName.WallsFloors,
          id,
          LayerName.Floor
        );
      }
    }
  }
};

const createWallTiles = (
  containers: MapContainer,
  bounds: { start: MapPosition; end: MapPosition; shape: boolean[][] },
  dimensions: MapDimensions
): void => {
  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      const position = { x, y };
      if (isPositionInAvailableArea(position, bounds)) continue;

      updateMapType(
        containers.wall,
        position,
        SpriteName.WallsFloors,
        MountainData.GeneralWall,
        LayerName.Wall
      );
    }
  }
};

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
  sprite.x = miner.position.x * InitialTileWidth;
  sprite.y = miner.position.y * InitialTileWidth;

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

//   const spriteData = minerSprites.get(miner.id);
//   if (!spriteData) return;

//   const animationType = getMinerAnimationType(miner);
//   const spriteName = SpriteName.CharacterPushBodyGreen;
//   const spriteDataConfig = Sprites.find((s) => s.name === spriteName);
//   if (!spriteDataConfig) return;

//   const animationData = spriteDataConfig.animations[animationType];
//   if (!animationData) return;

//   // Update position
//   spriteData.sprite.x = miner.position.x * MapTile.width;
//   spriteData.sprite.y = miner.position.y * MapTile.height;

//   // Update animation if type changed
//   if (spriteData.animationType !== animationType) {
//     spriteData.animationType = animationType;
//     spriteData.frame = 0;
//     spriteData.time = 0;

//     const texture = createMinerTilesetTexture(
//       SpriteName.CharacterPushBodyGreen,
//       animationData.frames[0]
//     );
//     spriteData.sprite.texture = texture;
//   }

//   // Update animation frame
//   spriteData.time += deltaTime / 1000;
//   if (spriteData.time >= animationData.speed) {
//     spriteData.time = 0;
//     spriteData.frame = (spriteData.frame + 1) % animationData.frames.length;

//     const texture = createMinerTilesetTexture(
//       SpriteName.CharacterPushBodyGreen,
//       animationData.frames[spriteData.frame]
//     );
//     spriteData.sprite.texture = texture;
//   }
// };

// Main Function
export const renderMapLayers = async (
  app: PIXI.Application,
  container: PIXI.Container,
  miners: Miner[],
  ores: Ore[],
  activeMine: string,
  tileCountX: number,
  tileCountY: number,
  onOreClick: (ore: Ore, tileCountX: number, tileCountY: number) => void,
  isBlackout: boolean
): Promise<void> => {
  try {
    const mine = MineTypes.find((m) => m.id === activeMine);
    if (!mine) {
      throw new Error("Active mine not found");
    }

    const dimensions: MapDimensions = {
      width: tileCountX,
      height: tileCountY,
    };

    const center = calculateMapCenter(dimensions);
    const bounds = calculateAvailableAreaBounds(center, mine.availableArea);
    const containers = createMapContainer(container);

    createFloorTiles(containers, bounds, dimensions);
    createWallTiles(containers, bounds, dimensions);

    const validOrePositions = findValidOrePositions(tileCountX, tileCountY);
    updateOrePositions(ores, validOrePositions, mine.rareOreChance || 1);
    ores.forEach((ore) => {
      const oreSprite = createOreSprite(
        ore,
        onOreClick,
        isBlackout,
        tileCountX,
        tileCountY
      );
      containers.miner.addChild(oreSprite);
    });

    const validMinerPositions = findValidMinerPositions(tileCountX, tileCountY);
    updateMinerPositions(miners, validMinerPositions, activeMine);

    miners.forEach((miner) => {
      const minerSprite = createMinerSprite(miner);
      containers.miner.addChild(minerSprite);
    });
  } catch (error) {
    console.error("Error rendering map layers:", error);
    throw error;
  }
};
