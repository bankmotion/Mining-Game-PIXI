import {
  FirstNames,
  InitialSpeed,
  LastNames,
  MinerTypes,
} from "@/constants/Miners";
import { AnimationType, LayerName } from "@/constants/Sprites";
import { Miner, MinerState, MinerType } from "@/interfaces/MinerTypes";
import { OreType } from "@/interfaces/OreTypes";
import { MapLayerType } from "./mapLogic";
import { MineTypes } from "@/constants/Mine";

// Types
interface Position {
  x: number;
  y: number;
}

type MinerInventory = Record<OreType, number>;

// Constants
const DEFAULT_INVENTORY: MinerInventory = {
  coal: 0,
  iron: 0,
  copper: 0,
  gold: 0,
  crystal: 0,
  gem: 0,
  legendary: 0,
  tin: 0,
  silver: 0,
  mithril: 0,
  thorium: 0,
  platinum: 0,
  orichalcum: 0,
  uranium: 0,
};

// Helper Functions
export const generateMinerName = (): string => {
  const firstName = FirstNames[Math.floor(Math.random() * FirstNames.length)];
  const lastName = LastNames[Math.floor(Math.random() * LastNames.length)];
  return `${firstName} ${lastName}`;
};

export const createMiner = (
  type: MinerType,
  position: Position,
  specialization?: OreType
): Miner => {
  const typeData = MinerTypes[type];

  const miner: Miner = {
    id: `miner-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: generateMinerName(),
    type,
    efficiency: typeData.baseEfficiency,
    speed: typeData.baseSpeed,
    capacity: typeData.baseCapacity,
    position: { ...position },
    state: "seeking",
    inventory: { ...DEFAULT_INVENTORY },
    inventoryValue: 0,
    lastDroppedValue: 0,
    miningProgress: 0,
    restProgress: 0,
    restDuration: 0,
    cost: typeData.baseCost,
  };

  if (specialization && type === "expert") {
    miner.specialization = specialization;
    miner.efficiency *= 2.0; // Experts get 100% efficiency bonus for their specialization
  }

  return miner;
};

export const findValidMinerPositions = (
  tileCountX: number,
  tileCountY: number
): Position[] => {
  const validPositions: Position[] = [];

  // Find valid positions within the mining area
  for (let y = 0; y < tileCountY; y++) {
    for (let x = 0; x < tileCountX; x++) {
      // Skip if out of bounds
      if (x < 0 || x >= tileCountX || y < 0 || y >= tileCountY) continue;

      // Check if the position is valid (has floor and no wall)
      if (MapLayerType[y] && MapLayerType[y][x] === LayerName.Floor) {
        // Ensure position is not too close to the base
        validPositions.push({ x, y });
      }
    }
  }

  return validPositions;
};

export const updateMinerPositions = (
  miners: Miner[],
  validPositions: Position[],
  activeMine: string
): void => {
  // Get the mine configuration
  const mine = MineTypes.find((m) => m.id === activeMine);
  if (!mine) return;

  // Generate new positions for miners
  const generatedPositions = generateMinerPositions(
    validPositions,
    miners.length,
    mine.basePosition
  );

  // Update each miner's position
  miners.forEach((miner, index) => {
    if (generatedPositions[index]) {
      miner.position = { ...generatedPositions[index] };
    }
  });
};

// Helper function to generate miner positions
const generateMinerPositions = (
  validPositions: Position[],
  count: number,
  basePosition: Position
): Position[] => {
  const availablePositions = [...validPositions];

  // Shuffle positions
  for (let i = availablePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availablePositions[i], availablePositions[j]] = [
      availablePositions[j],
      availablePositions[i],
    ];
  }

  // Take only the number of positions we need
  const selectedPositions = availablePositions.slice(0, count);

  // Sort positions by distance to base
  selectedPositions.sort((a, b) => {
    const distA = calculateDistance(a, basePosition);
    const distB = calculateDistance(b, basePosition);
    return distA - distB;
  });

  return selectedPositions;
};

export const createMinerAtPositions = (
  miners: Miner[],
  validPositions: Position[]
): void => {
  miners.forEach((miner, index) => {
    if (validPositions[index]) {
      miner.position = { ...validPositions[index] };
    }
  });
};

export const calculateInventoryValue = (
  inventory: MinerInventory,
  oreValues: Record<OreType, { value: number }>
): number => {
  return Object.entries(inventory).reduce((total, [oreType, amount]) => {
    return total + amount * (oreValues[oreType as OreType]?.value || 0);
  }, 0);
};

export const calculateDistance = (pos1: Position, pos2: Position): number => {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const isInventoryFull = (miner: Miner): boolean => {
  const totalItems = Object.values(miner.inventory).reduce(
    (sum, count) => sum + count,
    0
  );
  return totalItems >= miner.capacity;
};

export const moveMinerTowards = (
  miner: Miner,
  targetPosition: Position,
  deltaTime: number,
  state: MinerState
): Miner => {
  const speed = InitialSpeed * (state === "moving" ? 1 : 2);
  const dx = targetPosition.x - miner.position.x;
  const dy = targetPosition.y - miner.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 0.1) {
    return {
      ...miner,
      position: { ...targetPosition },
      targetPosition: undefined,
    };
  }

  const moveX = (dx / distance) * speed * deltaTime;
  const moveY = (dy / distance) * speed * deltaTime;

  return {
    ...miner,
    position: {
      x: miner.position.x + moveX,
      y: miner.position.y + moveY,
    },
  };
};

export const getMinerAnimationType = (miner: Miner): AnimationType => {
  if (miner.state === "mining") return AnimationType.DrillingRight;
  if (miner.state === "moving" || miner.state === "returning")
    return AnimationType.PushLeft;
  return AnimationType.Standing;
};

// New functions for miner state management
export const updateMinerState = (
  miner: Miner,
  deltaTime: number,
  targetOreId?: string
): Miner => {
  let updatedMiner = { ...miner };

  switch (miner.state) {
    case "seeking":
      if (targetOreId) {
        updatedMiner.state = "moving";
        updatedMiner.targetOreId = targetOreId;
      }
      break;
    case "moving":
      if (miner.targetPosition) {
        updatedMiner = moveMinerTowards(
          updatedMiner,
          miner.targetPosition,
          deltaTime,
          "moving"
        );
      }
      break;
    case "mining":
      updatedMiner.miningProgress += deltaTime * miner.efficiency;
      if (updatedMiner.miningProgress >= 1) {
        updatedMiner.state = "returning";
        updatedMiner.miningProgress = 0;
      }
      break;
    case "returning":
      if (miner.targetPosition) {
        updatedMiner = moveMinerTowards(
          updatedMiner,
          miner.targetPosition,
          deltaTime,
          "returning"
        );
      }
      break;
    case "resting":
      updatedMiner.restProgress += deltaTime;
      if (updatedMiner.restProgress >= updatedMiner.restDuration) {
        updatedMiner.state = "seeking";
        updatedMiner.restProgress = 0;
      }
      break;
  }

  return updatedMiner;
};

export const updateMiners = (
  miners: Miner[],
  deltaTime: number,
  targetOreIds: Record<string, string>
): Miner[] => {
  return miners.map((miner) => {
    const targetOreId = targetOreIds[miner.id];
    return updateMinerState(miner, deltaTime, targetOreId);
  });
};
