import { MineCartsData } from "@/constants/Sprites";
import { MapPosition } from "./MapTypes";

export interface Rail {
  id: string;
  position: MapPosition;
  type: MineCartsData;
  // direction: "up" | "down" | "left" | "right";
}
