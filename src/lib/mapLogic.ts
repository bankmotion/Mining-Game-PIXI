import * as PIXI from "pixi.js";

import { Game } from "@/constants/Game";
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
import { createOreSprite } from "./oreSprite";
import { updateRailPositions } from "./railLogic";
import { createRailSprite } from "./railMap";
import { Rail } from "@/interfaces/RailType";
import {
  createMapContainer,
  drawDoorSprite,
  drawFloorTiles,
  drawRailTiles,
  drawWallAndMountainTiles,
} from "./mapSprite";

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

  gameState.basePosition.x = Math.floor((startX + endX) / 2);
  gameState.basePosition.y = startY;

  updateMapLayerType(
    gameState.mapLayerType,
    gameState.basePosition,
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

// Core Functions
export const updateMapType = (
  container: PIXI.Container<PIXI.DisplayObject>,
  position: MapPosition,
  spriteName: SpriteName,
  id: number
): PIXI.Sprite => {
  const tileTexture = createTilesetTexture(spriteName, id);
  const tile = new PIXI.Sprite(tileTexture);

  tile.x = position.x * InitialTileWidth;
  tile.y = position.y * InitialTileWidth;
  container.addChild(tile);

  return tile;
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
  onBaseClick?: () => void
): Promise<void> => {
  try {
    // Create rail tiles
    const activeMine = gameState.mines[gameState.activeMine];
    if (!activeMine) {
      throw new Error("Active mine not found");
    }

    const containers = createMapContainer(container);

    const center = calculateMapCenter(gameState.mapDimensions);

    let updatedRails: Rail[] = [...gameState.rails];
    let updatedOres: Ore[] = [...ores];
    let updatedMiners: Miner[] = [...miners];

    if (!Game.loadedStatus) {
      updateFloorLayerByBounds(gameState, center, activeMine.availableArea);
      updateWallTile(gameState);
      updatedRails = updateRailPositions(gameState, activeMine);

      const validOrePositions = findValidOrePositions(gameState);
      updateOrePositions(
        updatedOres,
        validOrePositions,
        activeMine.rareOreChance || 1
      );
      updatedOres.map((ore) =>
        updateMapLayerType(gameState.mapLayerType, ore.position, LayerName.Ore)
      );

      // Create miner tiles
      const validMinerPositions = findValidMinerPositions(gameState);
      updateMinerPositionsRandomly(
        updatedMiners,
        validMinerPositions,
        gameState.activeMine,
        gameState.mapDimensions
      );
    } else {
      updatedOres = [...gameState.ores];
      updatedMiners = [...gameState.miners];
    }

    drawDoorSprite(gameState, containers, onBaseClick);
    drawFloorTiles(gameState, containers);
    drawWallAndMountainTiles(gameState, containers);
    drawRailTiles(gameState, containers, updatedRails);

    updateMapLayerType(
      gameState.mapLayerType,
      gameState.basePosition,
      LayerName.Doors
    );

    // Create ore tiles
    updatedOres.forEach((ore) => {
      createOreSprite(gameState, containers, ore, onOreClick, isBlackout);
    });

    // create mine cart sprites
    createMineCartRoute(gameState.mapLayerType, {
      x: gameState.basePosition.x,
      y: gameState.basePosition.y + 1,
    });

    const mineCartSprite = createMineCartSprite(MineCartRoutes[0], 0);
    containers.mineCart.addChild(mineCartSprite);

    updateGameState({
      ...gameState,
      rails: updatedRails,
      ores: updatedOres,
      miners: updatedMiners,
    });
  } catch (error) {
    console.error("Error rendering map layers:", error);
    throw error;
  }
};
