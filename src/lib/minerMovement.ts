import { Direction, MapDimensions, MapPosition } from "@/interfaces/MapTypes";
import { Miner, MinerMovementState } from "@/interfaces/MinerTypes";
import { findPath } from "./pathFindingLogic";
import { InitialTileWidth } from "@/constants/Sprites";

export const initializeMinerMovement = (
  tilePos: MapPosition,
  mapDimensions: MapDimensions
): MinerMovementState => {
  return {
    currentTilePos: { ...tilePos },
    targetTilePos: { ...tilePos },
    path: [],
    currentPathIndex: 0,
    isMoving: false,
    moveProgress: 0,
  };
};

export const updateMinerMovement = (miner: Miner, deltaTime: number) => {
  const movementState = miner.movement;
  const newState = { ...movementState };

  // if not moving and have a target, find a path
  if (
    !newState.isMoving &&
    (newState.currentTilePos.x !== newState.targetTilePos.x ||
      newState.currentTilePos.y !== newState.targetTilePos.y)
  ) {
    newState.path = findPath(newState.currentTilePos, newState.targetTilePos);
    newState.currentPathIndex = 0;
    newState.isMoving = newState.path.length > 0;
  }

  // if moving, update position
  if (newState.isMoving) {
    const moveAmount = (miner.speed * deltaTime) / 1000;
    newState.moveProgress += moveAmount;

    // if i've completed the current step
    if (newState.moveProgress >= 1) {
      newState.moveProgress = 0;
      newState.currentPathIndex++;
    }

    // if i've reached the end of the path, stop moving
    if (newState.currentPathIndex >= newState.path.length) {
      newState.isMoving = false;
      newState.currentTilePos = { ...newState.targetTilePos };
      newState.path = [];
    } else {
      // move to the next step
      newState.currentTilePos = {
        ...newState.path[newState.currentPathIndex],
      };
    }
  }

  miner.movement = newState;
};

export const getMinerDirection = (miner: Miner): Direction => {
  const movementState = miner.movement;

  if (
    !movementState.isMoving ||
    movementState.currentPathIndex >= movementState.path.length
  ) {
    return "left";
  }

  const current = movementState.currentTilePos;
  const next = movementState.path[movementState.currentPathIndex + 1];

  if (next.x > current.x) return "right";
  if (next.x < current.x) return "left";
  if (next.y > current.y) return "down";
  if (next.y < current.y) return "up";

  return "left";
};

export const getMinerDirectionByTwoPos = (
  currentPos: MapPosition,
  targetPos: MapPosition
): Direction => {
  if (targetPos.x > currentPos.x) return "right";
  if (targetPos.x < currentPos.x) return "left";
  if (targetPos.y > currentPos.y) return "down";
  if (targetPos.y < currentPos.y) return "up";

  return "left";
};
