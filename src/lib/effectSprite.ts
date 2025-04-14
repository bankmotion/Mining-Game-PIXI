import { CustomGraphics } from "@/interfaces/PixiTypes";
import * as PIXI from "pixi.js";

// Create a pulsing glow effect
export const createPulseEffect = (
  radius: number,
  color: string
): CustomGraphics => {
  const glow = new PIXI.Graphics() as CustomGraphics;
  glow.name = "pulse-glow";
  glow.userData = { countFrame: 0 };

  // Create a gradient fill
  const gradient = new PIXI.Graphics();
  gradient.beginFill(color, 0.4);
  gradient.drawCircle(0, 0, radius);
  gradient.endFill();

  // Add blur filter for glow effect
  const blurFilter = new PIXI.BlurFilter(4, 4);
  glow.filters = [blurFilter];

  // Add the gradient to the glow
  glow.addChild(gradient);

  return glow;
};
