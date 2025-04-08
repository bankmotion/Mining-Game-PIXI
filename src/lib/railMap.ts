import * as PIXI from "pixi.js";

import { InitialTileWidth, LayerName, SpriteName } from "@/constants/Sprites";
import { MapContainer } from "@/interfaces/MapTypes";
import { Rail } from "@/interfaces/RailType";
import { GameState } from "@/interfaces/GameType";
import { updateMapType } from "./mapSprite";

export const createRailSprite = (
  gameState: GameState,
  rail: Rail,
  containers: MapContainer
): PIXI.Sprite => {
  // Create a rail sprite based on the rail type
  const railSprite = updateMapType(
    containers.rail,
    rail.position,
    SpriteName.MineCarts,
    rail.type
  );

  railSprite.name = `rail-${rail.id}`;
  railSprite.x = rail.position.x * InitialTileWidth;
  railSprite.y = rail.position.y * InitialTileWidth;
  railSprite.width = InitialTileWidth;
  railSprite.height = InitialTileWidth;

  return railSprite;
};
