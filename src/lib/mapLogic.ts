import * as PIXI from "pixi.js";

import { OreData } from "@/constants/Ore";
import {
  FloorData,
  InitialTileWidth,
  LayerName,
  SpriteName,
  WallData,
} from "@/constants/Sprites";
import { GameState } from "@/interfaces/GameType";
import {
  MapContainer,
  MapDimensions,
  MapPosition,
  MinerSpriteData,
} from "@/interfaces/MapTypes";
import { Miner } from "@/interfaces/MinerTypes";
import { Ore } from "@/interfaces/OreTypes";
import { createTilesetTexture } from "@/utils/spriteLoader";
import { getRandomTileId } from "@/utils/utils";
import {
  createMineCartRoute,
  createMineCartSprite,
  MineCartRoutes,
} from "./mineCartLogic";
import {
  findValidMinerPositions,
  updateMinerPositionsRandomly,
} from "./minersLogic";
import { findValidOrePositions, updateOrePositions } from "./oresLogic";
import { updateRailPositions } from "./railLogic";
import { createRailSprite } from "./railMap";

// Constants
export const MapLayerType: LayerName[][] = [];
export const minerSprites = new Map<string, MinerSpriteData>();

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

// Helper Functions
const createMapContainer = (container: PIXI.Container): MapContainer => {
  const floorContainer = new PIXI.Container();
  floorContainer.name = LayerName.Floor;
  container.addChild(floorContainer);

  const wallContainer = new PIXI.Container();
  wallContainer.name = LayerName.Wall;
  container.addChild(wallContainer);

  const railContainer = new PIXI.Container();
  railContainer.name = LayerName.Rails;
  container.addChild(railContainer);

  const minerContainer = new PIXI.Container();
  minerContainer.name = LayerName.Miners;
  container.addChild(minerContainer);

  const oreContainer = new PIXI.Container();
  oreContainer.name = LayerName.Ore;
  container.addChild(oreContainer);

  const mineCartContainer = new PIXI.Container();
  mineCartContainer.name = LayerName.MineCart;
  container.addChild(mineCartContainer);

  return {
    floor: floorContainer,
    wall: wallContainer,
    miner: minerContainer,
    ore: oreContainer,
    rail: railContainer,
    mineCart: mineCartContainer,
  };
};

export const calculateMapCenter = (dimensions: MapDimensions): MapPosition => ({
  x: Math.floor(dimensions.width / 2),
  y: Math.floor(dimensions.height / 2),
});

// New function to generate a more natural cave shape
const generateCaveShape = (
  width: number,
  height: number,
  roughness: number
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
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!shape[y][x]) {
        let floorCount = 0;
        if (y === 0 || shape[y - 1][x]) floorCount++;
        if (y === height - 1 || shape[y + 1][x]) floorCount++;
        if (x === 0 || shape[y][x - 1]) floorCount++;
        if (x === width - 1 || shape[y][x + 1]) floorCount++;
        if (floorCount >= 3) shape[y][x] = true;
      }
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (shape[y][x]) {
        let floorCount = 0;
        if (y === 0 || !shape[y - 1][x]) floorCount++;
        if (y === height - 1 || !shape[y + 1][x]) floorCount++;
        if (x === 0 || !shape[y][x - 1]) floorCount++;
        if (x === width - 1 || !shape[y][x + 1]) floorCount++;
        if (floorCount >= 3) shape[y][x] = false;
      }
    }
  }

  // Add door at top center
  shape[0][Math.floor(width / 2)] = true;

  return shape;
};

export const calculateAvailableAreaBounds = (
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
    0.1
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
): PIXI.Sprite => {
  const tileTexture = createTilesetTexture(spriteName, id);
  const tile = new PIXI.Sprite(tileTexture);

  tile.x = position.x * InitialTileWidth;
  tile.y = position.y * InitialTileWidth;
  container.addChild(tile);

  if (!MapLayerType[position.y]) {
    MapLayerType[position.y] = [];
  }
  MapLayerType[position.y][position.x] = mapType;

  return tile;
};

const createFloorTiles = (
  containers: MapContainer,
  bounds: { start: MapPosition; end: MapPosition; shape: boolean[][] },
  dimensions: MapDimensions,
  onBaseClick: () => void,
  updateGameState: (gameState: GameState) => void
): { doorPosition: MapPosition } => {
  // First, find the top center position for the door
  const doorX = Math.floor((bounds.start.x + bounds.end.x) / 2);
  const doorY = bounds.start.y;
  const doorPosition: MapPosition = { x: doorX, y: doorY };

  // Place the door first
  if (isPositionInBounds(doorPosition, dimensions)) {
    const doorSprite = updateMapType(
      containers.floor,
      doorPosition,
      SpriteName.MineDoors,
      11,
      LayerName.Doors
    );

    // Set the base position
    updateGameState({
      basePosition: doorPosition,
    } as GameState);

    // Add click event to door sprite
    if (doorSprite) {
      doorSprite.eventMode = "static";
      doorSprite.cursor = "pointer";
      doorSprite.on("pointerdown", () => {
        if (onBaseClick) {
          onBaseClick();
        }
      });
    }
  }

  // Then create the rest of the floor tiles
  for (let y = bounds.start.y; y < bounds.end.y; y++) {
    for (let x = bounds.start.x; x < bounds.end.x; x++) {
      const position = { x, y };
      if (!isPositionInBounds(position, dimensions)) continue;

      const relativeX = x - bounds.start.x;
      const relativeY = y - bounds.start.y;

      // Skip the door position
      if (x === doorX && y === doorY) continue;

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
  return { doorPosition };
};

export const createOreSprite = (
  containers: MapContainer,
  ore: Ore,
  onOreClick: (ore: Ore) => void,
  isBlackout: boolean
) => {
  const sprite = updateMapType(
    containers.ore,
    ore.position,
    SpriteName.MiningOres,
    25 + Object.keys(OreData).findIndex((or) => or === ore.type),
    LayerName.Ore
  );

  if (!isBlackout && onOreClick) {
    sprite.eventMode = "static";
    sprite.cursor = "pointer";
    sprite.removeAllListeners();
    sprite.on("pointerdown", () => onOreClick(ore));
  }
  sprite.name = `ore-${ore.id}`;
  sprite.cursor = "pointer";
  sprite.alpha = ore.depleted ? 0.4 : 1;
};

const isConnectWithWallTile = (position: MapPosition) => {
  const { x, y } = position;
  const adjacent = {
    top:
      !MapLayerType[y - 1]?.[x] ||
      MapLayerType[y - 1]?.[x] === LayerName.Wall ||
      MapLayerType[y - 1]?.[x] === LayerName.Mountains,
    bottom:
      !MapLayerType[y + 1]?.[x] ||
      MapLayerType[y + 1]?.[x] === LayerName.Wall ||
      MapLayerType[y + 1]?.[x] === LayerName.Mountains,
    left:
      !MapLayerType[y]?.[x - 1] ||
      MapLayerType[y]?.[x - 1] === LayerName.Wall ||
      MapLayerType[y]?.[x - 1] === LayerName.Mountains,
    right:
      !MapLayerType[y]?.[x + 1] ||
      MapLayerType[y]?.[x + 1] === LayerName.Wall ||
      MapLayerType[y]?.[x + 1] === LayerName.Mountains,
  };

  // Determine wall type based on adjacent walls
  const { top, bottom, left, right } = adjacent;
  let tileType = "GeneralWall";

  if (!bottom || !left || !right || !top) {
    tileType = "MountainToDown";
  }

  return { tileType };
};

const isConnectWithMountainTile = (position: MapPosition) => {
  const { x, y } = position;
  let tileType = "GeneralWall";

  const adjacent = {
    top: MapLayerType[y - 1]?.[x] === LayerName.Mountains,
    bottom: MapLayerType[y + 1]?.[x] === LayerName.Mountains,
    left: MapLayerType[y]?.[x - 1] === LayerName.Mountains,
    right: MapLayerType[y]?.[x + 1] === LayerName.Mountains,
  };

  const { top, bottom, left, right } = adjacent;

  if (!bottom || !left || !right || !top) {
    if (top && left) {
      tileType = "WallToLeftUp";
    } else if (top && right) {
      tileType = "WallToRightUp";
    } else if (bottom && left) {
      tileType = "WallToLeftDown";
    } else if (bottom && right) {
      tileType = "WallToRightDown";
    } else if (top) {
      tileType = "WallToUp";
    } else if (bottom) {
      tileType = "WallToDown";
    } else if (left) {
      tileType = "WallToLeft";
    } else if (right) {
      tileType = "WallToRight";
    }
  }

  return { tileType };
};

const isBellowMountain = (position: MapPosition) => {
  const { x, y } = position;
  let tileType = "";

  if (MapLayerType[y - 1]?.[x] === LayerName.Mountains) {
    tileType = "MountainShadow";
  }

  return { tileType };
};

const createWallTiles = (
  containers: MapContainer,
  bounds: { start: MapPosition; end: MapPosition; shape: boolean[][] },
  dimensions: MapDimensions
): void => {
  // add normal wall
  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      const position = { x, y };
      if (isPositionInAvailableArea(position, bounds)) continue;

      const { tileType } = isConnectWithWallTile(position);
      updateMapType(
        containers.wall,
        position,
        SpriteName.WallsFloors,
        WallData[tileType],
        tileType === "MountainToDown" ||
          tileType === "MountainToLeftDown" ||
          tileType === "MountainToRightDown"
          ? LayerName.Mountains
          : LayerName.Wall
      );
    }
  }

  // add mountain tiles
  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      const position = { x, y };
      if (isPositionInAvailableArea(position, bounds)) continue;
      if (MapLayerType[y]?.[x] === LayerName.Mountains) continue;

      const { tileType } = isConnectWithMountainTile(position);
      updateMapType(
        containers.wall,
        position,
        SpriteName.WallsFloors,
        WallData[tileType],
        LayerName.Wall
      );
    }
  }

  // add wall to mountain
  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      const position = { x, y };
      if (
        MapLayerType[y]?.[x] === LayerName.Mountains ||
        MapLayerType[y]?.[x] === LayerName.Wall
      )
        continue;

      const { tileType } = isBellowMountain(position);
      if (tileType) {
        updateMapType(
          containers.wall,
          position,
          SpriteName.WallsFloors,
          WallData[tileType],
          LayerName.Floor
        );
      }
    }
  }
};

// Main Function
export const renderMapLayers = async (
  app: PIXI.Application,
  container: PIXI.Container,
  gameState: GameState,
  miners: Miner[],
  ores: Ore[],
  onOreClick: (ore: Ore) => void,
  updateGameState: (gameState: GameState) => void,
  isBlackout: boolean,
  dimensions?: MapDimensions,
  onBaseClick?: () => void
): Promise<void> => {
  try {
    const mine = gameState.mines[gameState.activeMine];
    if (!mine) {
      throw new Error("Active mine not found");
    }

    const center = calculateMapCenter(dimensions);
    const bounds = calculateAvailableAreaBounds(center, mine.availableArea);
    const containers = createMapContainer(container);

    // Create floor and door tiles
    const { doorPosition } = createFloorTiles(
      containers,
      bounds,
      dimensions,
      onBaseClick,
      updateGameState
    );
    createWallTiles(containers, bounds, dimensions);

    // Create rail tiles
    const activeMine = gameState.mines[gameState.activeMine];
    if (!activeMine) {
      throw new Error("Active mine not found");
    }

    const rails = updateRailPositions(activeMine, doorPosition);

    // Update game state with the new rails
    updateGameState({
      rails: rails,
    } as GameState);

    // Render rail sprites
    rails.forEach((rail) => {
      const railSprite = createRailSprite(rail, containers);
      containers.rail.addChild(railSprite);
    });

    // Create ore tiles
    const validOrePositions = findValidOrePositions(
      dimensions.width,
      dimensions.height
    );
    updateOrePositions(ores, validOrePositions, mine.rareOreChance || 1);
    ores.forEach((ore) => {
      createOreSprite(containers, ore, onOreClick, isBlackout);
      // containers.miner.addChild(oreSprite);
    });

    // Create miner tiles
    const validMinerPositions = findValidMinerPositions(
      dimensions.width,
      dimensions.height
    );
    updateMinerPositionsRandomly(
      miners,
      validMinerPositions,
      gameState.activeMine,
      dimensions
    );

    // Create miner sprites
    // miners.forEach((miner) => {
    //   const minerSprite = createMinerSprite(miner);
    //   containers.miner.addChild(minerSprite);
    // });

    // create mine cart sprites
    createMineCartRoute({
      x: doorPosition.x,
      y: doorPosition.y + 1,
    });

    const mineCartSprite = createMineCartSprite(MineCartRoutes[0], 0);
    containers.mineCart.addChild(mineCartSprite);
  } catch (error) {
    console.error("Error rendering map layers:", error);
    throw error;
  }
};
