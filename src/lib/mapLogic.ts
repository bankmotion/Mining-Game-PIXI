import { MapTile } from "@/constants/Map";
import { MineTypes } from "@/constants/Mine";
import {
  FloorData,
  LayerName,
  MountainData,
  SpriteName,
  AnimationType,
} from "@/constants/Sprites";
import { Ore } from "@/interfaces/OreTypes";
import { createTilesetTexture } from "@/utils/spriteLoader";
import { getRandomTileId } from "@/utils/utils";
import * as PIXI from "pixi.js";
import { findValidOrePositions, generateOresAtPositions } from "./oresLogic";
import { Miner } from "@/interfaces/MinerTypes";
import { MinerAnimations, MinerAnimationType } from "@/constants/Miners";

// Types
interface MapPosition {
  x: number;
  y: number;
}

interface MapDimensions {
  width: number;
  height: number;
}

interface MapContainer {
  floor: PIXI.Container;
  wall: PIXI.Container;
}

interface MinerSpriteData {
  sprite: PIXI.Sprite;
  animationType: MinerAnimationType;
  frame: number;
  time: number;
}

// Constants
export const MapLayerType: LayerName[][] = [];
const minerSprites = new Map<string, MinerSpriteData>();

// Helper Functions
const createMapContainer = (container: PIXI.Container): MapContainer => {
  const floorContainer = new PIXI.Container();
  floorContainer.name = LayerName.Floor;
  container.addChild(floorContainer);

  const wallContainer = new PIXI.Container();
  wallContainer.name = LayerName.Wall;
  container.addChild(wallContainer);

  return { floor: floorContainer, wall: wallContainer };
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

const updateOrePositions = (
  ores: Ore[],
  validPositions: MapPosition[],
  rareOreChance: number
): void => {
  const generatedOres = generateOresAtPositions(
    validPositions,
    ores.length,
    rareOreChance
  );

  ores.forEach((ore, index) => {
    if (generatedOres[index]) {
      ore.position = generatedOres[index].position;
    }
  });
};

// Miner Functions
const getMinerAnimationType = (miner: Miner): MinerAnimationType => {
  switch (miner.state) {
    case "mining":
      return MinerAnimationType.Drilling;
    case "moving":
      return MinerAnimationType.WalkingRight;
    case "returning":
      return MinerAnimationType.WalkingLeft;
    default:
      return MinerAnimationType.Standing;
  }
};

export const createMinerSprite = (miner: Miner): PIXI.Sprite => {
  const animationType = getMinerAnimationType(miner);
  const animationData = MinerAnimations[animationType];

  const sprite = new PIXI.Sprite();
  sprite.name = `miner-${miner.id}`;

  // Set initial position
  sprite.x = miner.position.x * MapTile.width;
  sprite.y = miner.position.y * MapTile.height;

  // Set initial texture
  const texture = createTilesetTexture(
    SpriteName.CharacterPushBodyGreen,
    animationData.animationId
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

export const updateMinerSprite = (miner: Miner, deltaTime: number): void => {
  const spriteData = minerSprites.get(miner.id);
  if (!spriteData) return;

  const animationType = getMinerAnimationType(miner);
  const animationData = MinerAnimations[animationType];

  // Update position
  spriteData.sprite.x = miner.position.x * MapTile.width;
  spriteData.sprite.y = miner.position.y * MapTile.height;

  // Update animation if type changed
  if (spriteData.animationType !== animationType) {
    spriteData.animationType = animationType;
    spriteData.frame = 0;
    spriteData.time = 0;

    const texture = createTilesetTexture(
      SpriteName.CharacterPushBodyGreen,
      animationData.animationId
    );
    spriteData.sprite.texture = texture;
  }

  // Update animation frame
  spriteData.time += deltaTime;
  if (spriteData.time >= animationData.animationSpeed * 1000) {
    spriteData.time = 0;
    spriteData.frame = (spriteData.frame + 1) % 6; // 6 frames per animation

    const texture = createTilesetTexture(
      SpriteName.CharacterPushBodyGreen,
      animationData.animationId + spriteData.frame * 4
    );
    spriteData.sprite.texture = texture;
  }
};

// Main Function
export const renderMapLayers = async (
  app: PIXI.Application,
  container: PIXI.Container,
  ores: Ore[],
  activeMine: string,
  tileCountX: number,
  tileCountY: number
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

    const validPositions = findValidOrePositions(
      tileCountX,
      tileCountY,
      activeMine
    );

    updateOrePositions(ores, validPositions, mine.rareOreChance || 1);
  } catch (error) {
    console.error("Error rendering map layers:", error);
    throw error;
  }
};
