import { MapPosition } from "./MapTypes";

export interface Rail {
  id: string;
  position: MapPosition;
  type: number;
  // direction: "up" | "down" | "left" | "right";
}
