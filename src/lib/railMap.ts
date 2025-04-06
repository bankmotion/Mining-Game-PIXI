import * as PIXI from "pixi.js";

import { Rail } from "@/interfaces/RailType";
import { MapContainer } from "@/interfaces/MapTypes";
import { updateMapType } from "./mapLogic";
import { InitialTileWidth, LayerName, SpriteName } from "@/constants/Sprites";

export const createRailSprite = (
  rail: Rail,
  containers: MapContainer
): PIXI.Sprite => {
  // Create a rail sprite based on the rail type
  const railSprite = updateMapType(
    containers.rail,
    rail.position,
    SpriteName.MineCarts,
    rail.type,
    LayerName.Rails
  );

  railSprite.name = `rail-${rail.id}`;
  railSprite.x = rail.position.x * InitialTileWidth;
  railSprite.y = rail.position.y * InitialTileWidth;
  railSprite.width = InitialTileWidth;
  railSprite.height = InitialTileWidth;

  return railSprite;
};
