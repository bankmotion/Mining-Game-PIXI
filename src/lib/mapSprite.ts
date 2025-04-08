import * as PIXI from "pixi.js";

import {
  FloorData,
  InitialTileWidth,
  LayerName,
  SpriteName,
  WallData,
} from "@/constants/Sprites";
import {
  MapContainer,
  MapDimensions,
  MapPosition,
} from "@/interfaces/MapTypes";
import {
  isBellowMountain,
  isConnectWithMountainTile,
  isConnectWithWallTile,
} from "./mapLogic";
import { GameState } from "@/interfaces/GameType";
import { getRandomTileIdByChance } from "@/utils/utils";
import { createRailSprite } from "./railMap";
import { Rail } from "@/interfaces/RailType";
import { createTilesetTexture } from "@/utils/spriteLoader";
import { createPulseEffect } from "./effectSprite";

export const createMapContainer = (container: PIXI.Container): MapContainer => {
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
  minerContainer.sortableChildren = true;
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

export const drawDoorSprite = (
  gameState: GameState,
  containers: MapContainer,
  onBaseClick: () => void
) => {
  // Place the door first
  const doorSprite = updateMapType(
    containers.floor,
    gameState.basePosition,
    SpriteName.MineDoors,
    11
  );

  // Add click event to door sprite
  if (doorSprite) {
    doorSprite.eventMode = "static";
    doorSprite.cursor = "pointer";
    doorSprite.on("pointerdown", () => {
      if (onBaseClick) {
        onBaseClick();
      }
    });

    const doorGlow = createPulseEffect(20, "0xfff700");
    doorGlow.x = doorSprite.width / 2;
    doorGlow.y = doorSprite.height / 2;
    doorGlow.zIndex = 1000;
    doorSprite.addChild(doorGlow);
  }
};

export const drawFloorTiles = (
  gameState: GameState,
  containers: MapContainer
) => {
  // Then create the rest of the floor tiles
  for (let y = 0; y < gameState.mapDimensions.height; y++) {
    for (let x = 0; x < gameState.mapDimensions.width; x++) {
      const position = { x, y };

      // Skip the door position
      if (x === gameState.basePosition.x && y === gameState.basePosition.y)
        continue;

      // Only create floor tiles where the shape is true
      if (gameState.mapLayerType[y]?.[x]) {
        const id = getRandomTileIdByChance(FloorData);
        updateMapType(containers.floor, position, SpriteName.WallsFloors, id);
      }
    }
  }
};

export const drawWallAndMountainTiles = (
  gameState: GameState,
  containers: MapContainer
) => {
  for (let y = 0; y < gameState.mapDimensions.height; y++) {
    for (let x = 0; x < gameState.mapDimensions.width; x++) {
      const position = { x, y };
      const type = gameState.mapLayerType[y]?.[x];

      if (type === LayerName.Mountains) {
        const { tileType } = isConnectWithWallTile(
          position,
          gameState.mapLayerType
        );

        updateMapType(
          containers.wall,
          position,
          SpriteName.WallsFloors,
          WallData[tileType]
        );
      } else if (type === LayerName.Wall) {
        const { tileType } = isConnectWithMountainTile(
          position,
          gameState.mapLayerType
        );

        updateMapType(
          containers.wall,
          position,
          SpriteName.WallsFloors,
          WallData[tileType]
        );
      } else if (type === LayerName.Floor) {
        const { tileType } = isBellowMountain(position, gameState.mapLayerType);
        if (tileType) {
          updateMapType(
            containers.floor,
            position,
            SpriteName.WallsFloors,
            WallData[tileType]
          );
        }
      }
    }
  }
};

export const drawRailTiles = (
  gameState: GameState,
  containers: MapContainer,
  rails: Rail[]
) => {
  for (const rail of rails) {
    const railSprite = createRailSprite(gameState, rail, containers);
    containers.rail.addChild(railSprite);
  }
};
