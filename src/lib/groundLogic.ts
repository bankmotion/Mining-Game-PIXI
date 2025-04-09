import { GroundSpriteData, LayerName } from "@/constants/Sprites";
import { GameState } from "@/interfaces/GameType";
import { GroundType } from "@/interfaces/GroundType";
import { MapPosition } from "@/interfaces/MapTypes";
import { getRandomNumber, posToKey } from "@/utils/utils";

// create ground
export const createGround = (gameState: GameState) => {
  const { mapLayerType } = gameState;
  const positions = validPositions(mapLayerType);
  let count = 30;
  let index = 0;
  let attempt = 500;

  const grounds: GroundType[] = [];
  const direction = {
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const directionKeys = Object.keys(direction);

  if (positions.length === 0) return [];

  // create the ground without type
  grounds.push({
    position: positions[getRandomNumber(0, positions.length - 1)],
    type: GroundSpriteData.Empty,
  });
  count--;

  const validPosSet = new Set(positions.map(posToKey));
  const groundPosSet = new Set(
    grounds.map((ground) => posToKey(ground.position))
  );

  while (count > 0 && attempt > 0) {
    attempt--;

    const targetPos = grounds[index].position;
    index++;

    for (const key of directionKeys) {
      const newPos = {
        x: targetPos.x + direction[key].x,
        y: targetPos.y + direction[key].y,
      };
      const newPosKey = posToKey(newPos);

      if (
        validPosSet.has(newPosKey) &&
        !groundPosSet.has(newPosKey) &&
        getRandomNumber(0, 100) < 80
      ) {
        grounds.push({
          position: newPos,
          type: GroundSpriteData.Empty,
        });
        groundPosSet.add(newPosKey);
        count--;
      }
    }
  }

  //   fill the ground if tile's all direction is ground
  for (const ground of grounds) {
    const pos = ground.position;
    let dirStatus = 0;

    directionKeys.forEach((key) => {
      const newPos = {
        x: pos.x + direction[key].x,
        y: pos.y + direction[key].y,
      };
      const newPosKey = posToKey(newPos);

      if (validPosSet.has(newPosKey)) dirStatus++;
    });

    if (dirStatus === 4) {
      ground.type = GroundSpriteData.Empty;
    }
  }

  // dentermine the type of the ground
  for (const ground of grounds) {
    const pos = ground.position;

    const dirStatus = {
      top: false,
      bottom: false,
      left: false,
      right: false,
    };

    directionKeys.forEach((key) => {
      const newPos = {
        x: pos.x + direction[key].x,
        y: pos.y + direction[key].y,
      };
      const newPosKey = posToKey(newPos);

      if (groundPosSet.has(newPosKey)) dirStatus[key] = true;
    });

    const { top, bottom, left, right } = dirStatus;
    if (top && bottom && left && right) {
      ground.type = GroundSpriteData.Empty;
    } else if (top && bottom && left) {
      ground.type = GroundSpriteData.T_B_L;
    } else if (top && bottom && right) {
      ground.type = GroundSpriteData.T_B_R;
    } else if (top && left && right) {
      ground.type = GroundSpriteData.T_L_R;
    } else if (top && bottom) {
      ground.type = GroundSpriteData.T_B;
    } else if (left && right) {
      ground.type = GroundSpriteData.L_R;
    } else if (top && left) {
      ground.type = GroundSpriteData.T_L;
    } else if (bottom && right) {
      ground.type = GroundSpriteData.B_R;
    } else if (bottom && left) {
      ground.type = GroundSpriteData.B_L;
    } else if (top && right) {
      ground.type = GroundSpriteData.T_R;
    } else if (top) {
      ground.type = GroundSpriteData.T;
    } else if (bottom) {
      ground.type = GroundSpriteData.B;
    } else if (left) {
      ground.type = GroundSpriteData.L;
    } else if (right) {
      ground.type = GroundSpriteData.R;
    } else {
      ground.type = GroundSpriteData.Empty;
    }
  }
  console.log(grounds);

  return grounds;
};

// get all positions that are available to create ground
export const validPositions = (mapLayerType: LayerName[][]) => {
  const positions: MapPosition[] = [];
  for (let i = 0; i < mapLayerType.length; i++) {
    for (let j = 0; j < mapLayerType[i].length; j++) {
      if (isValidToCreateGround(mapLayerType, { x: j, y: i })) {
        positions.push({ x: j, y: i });
      }
    }
  }
  return positions;
};

// check if the position is valid to create ground
export const isValidToCreateGround = (
  mapLayerType: LayerName[][],
  pos: MapPosition
) => {
  const type = mapLayerType[pos.y]?.[pos.x];

  // all direction should be not walls
  const direction = {
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const directionKeys = Object.keys(direction);
  let count = 0;

  directionKeys.forEach((key) => {
    const x = pos.x + direction[key].x;
    const y = pos.y + direction[key].y;

    if (
      mapLayerType[y]?.[x] === LayerName.Floor ||
      mapLayerType[y]?.[x] === LayerName.Rails
    ) {
      count++;
    }
  });

  return (type === LayerName.Floor || type === LayerName.Rails) && count === 4;
};
