import * as PIXI from "pixi.js";

import { Game } from "@/constants/Game";
import { LayerName } from "@/constants/Sprites";
import { GameState } from "@/interfaces/GameType";
import {
  Direction,
  MapContainer,
  MapDimensions,
  MapPosition,
  MinerSpriteData,
} from "@/interfaces/MapTypes";
import { Miner } from "@/interfaces/MinerTypes";
import { Ore } from "@/interfaces/OreTypes";
import { createGround } from "./groundLogic";
import {
  createMapContainer,
  drawDoorSprite,
  drawFloorTiles,
  drawGroundTiles,
  drawRailTiles,
  drawWallAndMountainTiles,
} from "./mapSprite";
import {
  createMineCartRoute,
  createMineCartSprite,
  MineCartRoutes,
} from "./mineCartLogic";
import {
  createMiner,
  findValidMinerPositions,
  updateMinerPositionsRandomly,
} from "./minersLogic";
import {
  findValidOrePositions,
  generateInitialOres,
  updateOrePositions,
} from "./oresLogic";
import { createOreSprite } from "./oreSprite";
import { updateRailPositions } from "./railLogic";

// Constants
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

export const updateFloorLayerByBounds = (
  gameState: GameState,
  center: MapPosition,
  availableArea: MapDimensions
) => {
  const startX = center.x - Math.floor(availableArea.width / 2);
  const startY = center.y - Math.floor(availableArea.height / 2);
  const endX = startX + availableArea.width;
  console.log(startX, startY, endX, availableArea.width, availableArea.height);

  const updatedBasePosition = {
    x: Math.floor((startX + endX) / 2),
    y: startY,
  };

  updateMapLayerType(
    gameState.mapLayerType,
    updatedBasePosition,
    LayerName.Doors
  );

  // Generate the cave shape
  const shape = generateCaveShape(
    availableArea.width,
    availableArea.height,
    0.1
  );

  for (let y = 0; y < availableArea.height; y++) {
    for (let x = 0; x < availableArea.width; x++) {
      if (shape[y][x]) {
        updateMapLayerType(
          gameState.mapLayerType,
          { x: x + startX, y: y + startY },
          LayerName.Floor
        );
      }
    }
  }

  return { updatedBasePosition };
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

export const updateMapLayerType = (
  mapLayerType: LayerName[][],
  position: MapPosition,
  layerName: LayerName
) => {
  if (!mapLayerType[position.y]) {
    mapLayerType[position.y] = [];
  }
  mapLayerType[position.y][position.x] = layerName;
};

export const getDirectionByTwoPos = (
  currentPos: MapPosition,
  targetPos: MapPosition
): Direction => {
  if (targetPos.x > currentPos.x) return "right";
  if (targetPos.x < currentPos.x) return "left";
  if (targetPos.y > currentPos.y) return "down";
  if (targetPos.y < currentPos.y) return "up";

  return "left";
};

export const isConnectWithWallTile = (
  position: MapPosition,
  mapLayerType: LayerName[][]
) => {
  const { x, y } = position;
  const adjacent = {
    top:
      !mapLayerType[y - 1]?.[x] ||
      mapLayerType[y - 1]?.[x] === LayerName.Wall ||
      mapLayerType[y - 1]?.[x] === LayerName.Mountains,
    bottom:
      !mapLayerType[y + 1]?.[x] ||
      mapLayerType[y + 1]?.[x] === LayerName.Wall ||
      mapLayerType[y + 1]?.[x] === LayerName.Mountains,
    left:
      !mapLayerType[y]?.[x - 1] ||
      mapLayerType[y]?.[x - 1] === LayerName.Wall ||
      mapLayerType[y]?.[x - 1] === LayerName.Mountains,
    right:
      !mapLayerType[y]?.[x + 1] ||
      mapLayerType[y]?.[x + 1] === LayerName.Wall ||
      mapLayerType[y]?.[x + 1] === LayerName.Mountains,
  };

  // Determine wall type based on adjacent walls
  const { top, bottom, left, right } = adjacent;
  let tileType = "GeneralWall";

  if (!bottom || !left || !right || !top) {
    tileType = "MountainToDown";
  }

  return { tileType };
};

export const isConnectWithMountainTile = (
  position: MapPosition,
  mapLayerType: LayerName[][]
) => {
  const { x, y } = position;
  let tileType = "GeneralWall";

  const adjacent = {
    top: mapLayerType[y - 1]?.[x] === LayerName.Mountains,
    bottom: mapLayerType[y + 1]?.[x] === LayerName.Mountains,
    left: mapLayerType[y]?.[x - 1] === LayerName.Mountains,
    right: mapLayerType[y]?.[x + 1] === LayerName.Mountains,
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

export const isBellowMountain = (
  position: MapPosition,
  mapLayerType: LayerName[][]
) => {
  const { x, y } = position;
  let tileType = "";

  if (mapLayerType[y - 1]?.[x] === LayerName.Mountains) {
    tileType = "MountainShadow";
  }

  return { tileType };
};

const updateWallTile = (gameState: GameState): void => {
  const dimensions = gameState.mapDimensions;
  // add normal wall
  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      const position = { x, y };
      if (gameState.mapLayerType[y]?.[x] === LayerName.Floor) continue;

      const { tileType } = isConnectWithWallTile(
        position,
        gameState.mapLayerType
      );

      updateMapLayerType(
        gameState.mapLayerType,
        position,
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
      if (
        gameState.mapLayerType[y]?.[x] === LayerName.Mountains ||
        gameState.mapLayerType[y]?.[x] === LayerName.Floor
      )
        continue;

      updateMapLayerType(gameState.mapLayerType, position, LayerName.Wall);
    }
  }
};

export const initialDataUpdate = (gameState: GameState): GameState => {
  const activeMine = gameState.mines[gameState.activeMine];
  if (!activeMine) {
    throw new Error("Active mine not found");
  }

  gameState.mapLayerType = [];
  const center = calculateMapCenter(gameState.mapDimensions);

  const { updatedBasePosition } = updateFloorLayerByBounds(
    gameState,
    center,
    activeMine.availableArea
  );

  updateWallTile(gameState);
  const { updatedRails } = updateRailPositions(
    { ...gameState, basePosition: updatedBasePosition },
    activeMine
  );
  const { updatedGrounds } = createGround(gameState);

  const validOrePositions = findValidOrePositions(gameState, updatedGrounds);
  const { updatedOres } = updateOrePositions(
    gameState,
    validOrePositions,
    activeMine.rareOreChance || 1
  );
  updatedOres.map((ore) =>
    updateMapLayerType(gameState.mapLayerType, ore.position, LayerName.Ore)
  );

  // Create miner tiles
  const validMinerPositions = findValidMinerPositions(gameState);
  const { updatedMiners } = updateMinerPositionsRandomly(
    gameState,
    validMinerPositions
  );

  return {
    ...gameState,
    basePosition: updatedBasePosition,
    rails: updatedRails,
    ores: updatedOres,
    miners: updatedMiners,
    grounds: updatedGrounds,
  };
};

export const drawSprites = (
  gameState: GameState,
  containers: MapContainer,
  onBaseClick: () => void,
  onOreClick: (ore: Ore) => void
) => {
  const { rails, ores, miners, grounds } = gameState;
  drawDoorSprite(gameState, containers, onBaseClick);
  drawFloorTiles(gameState, containers);
  drawWallAndMountainTiles(gameState, containers);
  drawRailTiles(gameState, containers, rails);
  drawGroundTiles(containers, grounds);

  updateMapLayerType(
    gameState.mapLayerType,
    gameState.basePosition,
    LayerName.Doors
  );

  // Create ore tiles
  ores.forEach((ore) => {
    createOreSprite(gameState, containers, ore, onOreClick);
  });

  // create mine cart sprites
  createMineCartRoute(gameState.mapLayerType, {
    x: gameState.basePosition.x,
    y: gameState.basePosition.y + 1,
  });

  const mineCartSprite = createMineCartSprite(MineCartRoutes[0], 0);
  containers.mineCart.addChild(mineCartSprite);
};

// Main Function
export const renderMapLayers = async (
  container: PIXI.Container,
  gameState: GameState,
  onOreClick: (ore: Ore) => void,
  updateGameState: (gameState: GameState) => void,
  onBaseClick?: () => void
): Promise<void> => {
  try {
    // Create rail tiles
    const containers = createMapContainer(container);

    let updatedGameState = {
      ...gameState,
    };

    // if the game is not loaded, we need to initialize the game state
    if (!Game.loadedStatus) {
      Game.loadedStatus = true;
      updatedGameState = initialDataUpdate(updatedGameState);

      updateGameState(updatedGameState);
    }

    console.log("updated game state", updatedGameState);
    drawSprites(updatedGameState, containers, onBaseClick, onOreClick);
  } catch (error) {
    console.error("Error rendering map layers:", error);
    throw error;
  }
};
