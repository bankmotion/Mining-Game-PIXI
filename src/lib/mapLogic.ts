import * as PIXI from "pixi.js";
import { MapTile, MineMap } from "@/constants/Map";
import { MineTypes } from "@/constants/Mine";
import { Ore } from "@/interfaces/OreTypes";
import { createTilesetTexture } from "@/utils/spriteLoader";
import {
  FloorData,
  LayerName,
  MountainData,
  SpriteName,
} from "@/constants/Sprites";
import { getRandomNumber, getRandomTileId } from "@/utils/utils";
import { findValidOrePositions, generateOresAtPositions } from "./ores";

export const MapLayerType: LayerName[][] = [];

export const updateMapType = (
  container: PIXI.Container<PIXI.DisplayObject>,
  x: number,
  y: number,
  spriteName: SpriteName,
  id: number,
  startX: number,
  startY: number,
  mapType: LayerName
) => {
  const tileTexture = createTilesetTexture(spriteName, id);
  const tile = new PIXI.Sprite(tileTexture);

  tile.x = startX;
  tile.y = startY;
  container.addChild(tile);

  if (!MapLayerType[y]) {
    MapLayerType[y] = [];
  }
  MapLayerType[y][x] = mapType;
};

// Function to render map layers
export const renderMapLayers = async (
  app: PIXI.Application,
  container: PIXI.Container,
  ores: Ore[],
  activeMine: string,
  tileCountX: number,
  tileCountY: number
) => {
  try {
    // Get the active mine
    const mine = MineTypes.find((m) => m.id === activeMine);
    if (!mine) {
      console.error("Active mine not found");
      return;
    }

    // Get the available area dimensions
    const availableWidth = mine.availableArea.width;
    const availableHeight = mine.availableArea.height;

    // Calculate the center position of the map
    const centerX = Math.floor(tileCountX / 2);
    const centerY = Math.floor(tileCountY / 2);

    // Calculate the starting position of the available area (centered)
    const startX = centerX - Math.floor(availableWidth / 2);
    const startY = centerY - Math.floor(availableHeight / 2);

    // Create containers for each layer
    const floorContainer = new PIXI.Container();
    floorContainer.name = LayerName.Floor;
    container.addChild(floorContainer);

    const wallContainer = new PIXI.Container();
    wallContainer.name = LayerName.Wall;
    container.addChild(wallContainer);

    // Create floor tiles in the available area
    for (let y = startY; y < startY + availableHeight; y++) {
      for (let x = startX; x < startX + availableWidth; x++) {
        // Skip if out of bounds
        if (x < 0 || x >= tileCountX || y < 0 || y >= tileCountY) continue;

        const id = getRandomTileId(FloorData);
        const posX = x * MapTile.width;
        const posY = y * MapTile.height;

        // Add floor tile
        updateMapType(
          floorContainer,
          x,
          y,
          SpriteName.WallsFloors,
          id,
          posX,
          posY,
          LayerName.Floor
        );
      }
    }

    // Create wall tiles around the available area
    for (let y = 0; y < tileCountY; y++) {
      for (let x = 0; x < tileCountX; x++) {
        // Skip if in the available area
        if (
          x >= startX &&
          x < startX + availableWidth &&
          y >= startY &&
          y < startY + availableHeight
        ) {
          continue;
        }

        const posX = x * MapTile.width;
        const posY = y * MapTile.height;

        // Add wall tile
        updateMapType(
          wallContainer,
          x,
          y,
          SpriteName.WallsFloors,
          MountainData.GeneralWall,
          posX,
          posY,
          LayerName.Wall
        );
      }
    }

    // Find valid positions for ores (only within the available area)
    const validPositions = findValidOrePositions(
      tileCountX,
      tileCountY,
      activeMine
    );

    // Generate ores at valid positions
    const generatedOres = generateOresAtPositions(
      validPositions,
      ores.length,
      mine.rareOreChance || 1
    );

    // Update ore positions with generated positions
    ores.forEach((ore, index) => {
      if (generatedOres[index]) {
        ore.position = generatedOres[index].position;
      }
    });
  } catch (error) {
    console.error("Error rendering map layers:", error);
  }
};
