import { GroundSpriteData } from "@/constants/Sprites";
import { MapPosition } from "./MapTypes";

export interface GroundType {
  position: MapPosition;
  type: GroundSpriteData;
}
