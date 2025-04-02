import * as PIXI from "pixi.js";
import { Tileset } from "./MapTypes";

export interface AnimatedSprite extends PIXI.Sprite {
  userData: {
    frame: number;
    animationSpeed: number;
    time: number;
    tileset: Tileset;
    baseTexture: PIXI.BaseTexture;
    animation?: { tileid: number; duration: number }[];
    animationType?: string;
  };
}

export interface BaseSpriteConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: number;
  backgroundAlpha: number;
  borderColor: number;
  textColor: number;
  fontSize: number;
  glowColor: number;
  glowAlpha: number;
  glowRadius: number;
}
