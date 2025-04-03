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
    // Create containers for each layer

    // Create floor tiles
    const floorContainer = new PIXI.Container();
    floorContainer.name = LayerName.Floor;
    container.addChild(floorContainer);

    for (let i = 0; i < tileCountX * tileCountY; i++) {
      const id = getRandomTileId(FloorData);
      const x = (i % tileCountX) * MapTile.width;
      const y = Math.floor(i / tileCountX) * MapTile.height;

      // Add to MapLayerType
      updateMapType(
        floorContainer,
        i % tileCountX,
        Math.floor(i / tileCountX),
        SpriteName.WallsFloors,
        id,
        x,
        y,
        LayerName.Floor
      );
    }

    // Create mountain tiles
    const mountainContainer = new PIXI.Container();
    mountainContainer.name = LayerName.Mountains;
    container.addChild(mountainContainer);

    const minY = getRandomNumber(3, 5);
    const maxY = getRandomNumber(12, 15);
    const minX = getRandomNumber(3, 5);
    const maxX = getRandomNumber(tileCountX - 5, tileCountX - 3);
    let startY = minY;

    for (let i = minX; i <= maxX; i++) {
      const x = i * MapTile.width;
      const y = startY * MapTile.height;

      // Add to MapLayerType
      updateMapType(
        mountainContainer,
        i,
        startY,
        SpriteName.WallsFloors,
        MountainData.BottomEnhance,
        x,
        y,
        LayerName.Mountains
      );

      // Create wall tiles on the top of the mountain
      for (let j = 0; j < startY; j++) {
        const x = i * MapTile.width;
        const y = j * MapTile.height;

        // Add to MapLayerType
        updateMapType(
          mountainContainer,
          i,
          j,
          SpriteName.WallsFloors,
          MountainData.GeneralWall,
          x,
          y,
          LayerName.Wall
        );
      }

      const increaseStatus = getRandomNumber(1, 10);
      if (increaseStatus <= 2) {
        if (i < (tileCountX / 3) * 2) {
          if (startY < maxY) {
            startY += 1;
          }
        } else {
          startY -= 1;
        }
      }
    }

    // Create wall tiles
    for (let i = minY; i < tileCountY - minY; i++) {
      const x = (minX - 1) * MapTile.width;
      const y = i * MapTile.height;

      // Add to MapLayerType
      updateMapType(
        mountainContainer,
        i,
        startY,
        SpriteName.WallsFloors,
        MountainData.RightWall,
        x,
        y,
        LayerName.Wall
      );

      if (i < startY) continue;

      const rx = (maxX + 1) * MapTile.width;
      const ry = i * MapTile.height;

      // Add to MapLayerType
      updateMapType(
        mountainContainer,
        maxX + 1,
        i,
        SpriteName.WallsFloors,
        MountainData.LeftWall,
        rx,
        ry,
        LayerName.Wall
      );
    }

    // Find valid positions for ores
    const validPositions = findValidOrePositions(tileCountX, tileCountY);

    // Generate ores at valid positions
    const generatedOres = generateOresAtPositions(
      validPositions,
      ores.length,
      MineTypes.find((m) => m.id === activeMine)?.rareOreChance || 1
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
