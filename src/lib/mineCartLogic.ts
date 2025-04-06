import { Direction, MapPosition } from "@/interfaces/MapTypes";
import {
  AnimationType,
  InitialTileWidth,
  LayerName,
  SpriteName,
  Sprites,
} from "@/constants/Sprites";
import { MapLayerType } from "./mapLogic";
import { getRandomNumber } from "@/utils/utils";
import * as PIXI from "pixi.js";
import {
  createMinerTilesetTexture,
  createTilesetTexture,
} from "@/utils/spriteLoader";
import { AnimatedSprite } from "@/interfaces/PixiTypes";

export let MineCartRoutes: {
  pos: MapPosition;
  direction: "up" | "down" | "left" | "right";
}[] = [];
export const MineCartSpriteProgress: {
  tinyProgress: number; // from 0 to 1
  frameId: number;
} = {
  tinyProgress: 0,
  frameId: 0,
};

export const createMineCartRoute = (
  start: MapPosition
): { pos: MapPosition; direction: "up" | "down" | "left" | "right" }[] => {
  const route: {
    pos: MapPosition;
    direction: "up" | "down" | "left" | "right";
  }[] = [];

  // Start position is below the base position
  const startPos: MapPosition = start;

  // Add the starting position
  route.push({
    pos: { ...startPos },
    direction: "down", // Initial direction is down
  });

  // Create a random path that returns to the starting position
  const currentPos = { ...startPos };
  const directions: Direction[] = ["up", "down", "left", "right"];
  const maxMeeting = 5;
  let attemptCount = 0;

  const isValid = (pos: MapPosition) => {
    if (
      MapLayerType[pos.y] &&
      MapLayerType[pos.y][pos.x] &&
      MapLayerType[pos.y][pos.x] === LayerName.Rails
    ) {
      return true;
    }
    return false;
  };

  const updateTileByDir = (pos: MapPosition, dir: Direction) => {
    if (dir === "up") pos.y -= 1;
    else if (dir === "down") pos.y += 1;
    else if (dir === "left") pos.x -= 1;
    else if (dir === "right") pos.x += 1;
  };

  while (attemptCount < maxMeeting) {
    // Get the current position and direction
    const currentTilePos = { ...route[route.length - 1].pos };

    // Get the previous position (to avoid going back)
    const previousPos =
      route.length > 1 ? { ...route[route.length - 2].pos } : null;

    // Find all valid next positions
    const validNextPositions: { pos: MapPosition; direction: Direction }[] = [];

    // Check all 4 directions
    for (const direction of directions) {
      const nextPos = { ...currentTilePos };
      updateTileByDir(nextPos, direction);

      // Check if this position is valid
      if (isValid(nextPos)) {
        validNextPositions.push({ pos: nextPos, direction });
      }
    }

    // If no valid positions found, break the loop
    if (validNextPositions.length === 0) {
      break;
    }

    // Filter out the previous position if possible
    let availablePositions = validNextPositions;
    if (previousPos && validNextPositions.length > 1) {
      availablePositions = validNextPositions.filter(
        (pos) => pos.pos.x !== previousPos.x || pos.pos.y !== previousPos.y
      );

      // If no positions available after filtering, use all valid positions
      if (availablePositions.length === 0) {
        availablePositions = validNextPositions;
      }
    }

    // Select a random position from the available positions
    const selectedIndex = getRandomNumber(0, availablePositions.length - 1);
    const selected = availablePositions[selectedIndex];

    // Add the selected position to the route
    route.push({
      pos: { ...selected.pos },
      direction: selected.direction,
    });

    if (selected.pos.x === start.x && selected.pos.y === start.y) {
      attemptCount++;
    }
  }

  MineCartRoutes = route;
  return route;
};

export const createMineCartSprite = (
  route: {
    pos: MapPosition;
    direction: Direction;
  },
  frameId: number
): PIXI.Sprite => {
  const sprite = new PIXI.Sprite();
  sprite.name = "mine-cart";

  // Set initial position based on the first route position
  sprite.x = route.pos.x * InitialTileWidth;
  sprite.y = route.pos.y * InitialTileWidth;

  // Set initial texture based on direction
  const spriteData = Sprites.find(
    (sprite) => sprite.name === SpriteName.MineCartAnimation
  );
  const animation =
    spriteData?.animations[getMineCartFrameByDirection(route.direction)];

  const texture = createMinerTilesetTexture(
    SpriteName.MineCartAnimation,
    animation.frames[frameId % animation.frames.length]
  );
  sprite.texture = texture;

  return sprite;
};

const getMineCartFrameByDirection = (direction: Direction): AnimationType => {
  switch (direction) {
    case "up":
      return AnimationType.MineCartAnimationUp;
    case "right":
      return AnimationType.MineCartAnimationRight;
    case "down":
      return AnimationType.MineCartAnimationDown;
    case "left":
      return AnimationType.MineCartAnimationLeft;
    default:
      return AnimationType.MineCartAnimationUp;
  }
};

export const updateMineCartAnimation = (
  sprite: AnimatedSprite,
  deltaTime: number
) => {
  const spriteData = Sprites.find(
    (sprite) => sprite.name === SpriteName.MineCartAnimation
  );
  if (!spriteData) return;

  MineCartSpriteProgress.tinyProgress += (deltaTime / 1000) * 3;
  if (MineCartSpriteProgress.tinyProgress > 1) {
    MineCartSpriteProgress.tinyProgress = 0;
    MineCartSpriteProgress.frameId++;
  }

  // Get the current route
  const mineCartRoute =
    MineCartRoutes[MineCartSpriteProgress.frameId % MineCartRoutes.length];

  // update position
  const direction =
    MineCartRoutes[(MineCartSpriteProgress.frameId + 1) % MineCartRoutes.length]
      .direction;

  sprite.x =
    (mineCartRoute.pos.x +
      (direction === "left"
        ? -MineCartSpriteProgress.tinyProgress
        : direction === "right"
        ? MineCartSpriteProgress.tinyProgress
        : 0)) *
    InitialTileWidth;
  sprite.y =
    (mineCartRoute.pos.y +
      (direction === "up"
        ? -MineCartSpriteProgress.tinyProgress
        : direction === "down"
        ? MineCartSpriteProgress.tinyProgress
        : 0)) *
    InitialTileWidth;

  const animation =
    spriteData?.animations[
      getMineCartFrameByDirection(mineCartRoute.direction)
    ];

  const texture = createMinerTilesetTexture(
    SpriteName.MineCartAnimation,
    animation.frames[MineCartSpriteProgress.frameId % animation.frames.length]
  );
  sprite.texture = texture;
};
