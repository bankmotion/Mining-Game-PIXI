import { MapTile } from "@/constants/Map";
import { MineTypes } from "@/constants/Mine";
import {
  FloorData,
  LayerName,
  MountainData,
  SpriteName,
} from "@/constants/Sprites";
import { Ore } from "@/interfaces/OreTypes";
import { createTilesetTexture } from "@/utils/spriteLoader";
import { getRandomTileId } from "@/utils/utils";
import * as PIXI from "pixi.js";
import { findValidOrePositions, generateOresAtPositions } from "./oresLogic";

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

// Constants
export const MapLayerType: LayerName[][] = [];

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

const calculateAvailableAreaBounds = (
  center: MapPosition,
  availableArea: MapDimensions
): { start: MapPosition; end: MapPosition } => {
  const startX = center.x - Math.floor(availableArea.width / 2);
  const startY = center.y - Math.floor(availableArea.height / 2);
  const endX = startX + availableArea.width;
  const endY = startY + availableArea.height;

  return {
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
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
  bounds: { start: MapPosition; end: MapPosition }
): boolean => {
  return (
    pos.x >= bounds.start.x &&
    pos.x < bounds.end.x &&
    pos.y >= bounds.start.y &&
    pos.y < bounds.end.y
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
  bounds: { start: MapPosition; end: MapPosition },
  dimensions: MapDimensions
): void => {
  for (let y = bounds.start.y; y < bounds.end.y; y++) {
    for (let x = bounds.start.x; x < bounds.end.x; x++) {
      const position = { x, y };
      if (!isPositionInBounds(position, dimensions)) continue;

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
};

const createWallTiles = (
  containers: MapContainer,
  bounds: { start: MapPosition; end: MapPosition },
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
