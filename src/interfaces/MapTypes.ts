import { AnimationType } from "@/constants/Sprites";
import * as PIXI from "pixi.js";

// Types
export interface MapPosition {
  x: number;
  y: number;
}

export interface MapDimensions {
  width: number;
  height: number;
}

export interface MapContainer {
  floor: PIXI.Container;
  wall: PIXI.Container;
  miner: PIXI.Container;
  ore: PIXI.Container;
  rail: PIXI.Container;
}

export interface MinerSpriteData {
  sprite: PIXI.Sprite;
  animationType: AnimationType;
  frame: number;
  time: number;
}
