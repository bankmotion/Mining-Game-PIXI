import {
  FirstNames,
  InitialSpeed,
  LastNames,
  MinerTypes,
} from "@/constants/Miners";
import { Miner, MinerState, MinerType } from "@/interfaces/MinerTypes";
import { OreType } from "@/interfaces/OreTypes";

// Generate a random miner name
export const generateMinerName = (): string => {
  const firstName = FirstNames[Math.floor(Math.random() * FirstNames.length)];
  const lastName = LastNames[Math.floor(Math.random() * LastNames.length)];
  return `${firstName} ${lastName}`;
};

// Create a new miner of a specific type
export const createMiner = (
  type: MinerType,
  position: { x: number; y: number },
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
    inventory: {
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
    },
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

// Calculate inventory value for a miner
export const calculateInventoryValue = (
  inventory: Record<OreType, number>,
  oreValues: Record<OreType, { value: number }>
): number => {
  return Object.entries(inventory).reduce((total, [oreType, amount]) => {
    return total + amount * oreValues[oreType as OreType].value;
  }, 0);
};

// Calculate distance between two points
export const calculateDistance = (
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): number => {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Move miner towards target position
export const moveMinerTowards = (
  miner: Miner,
  targetPosition: { x: number; y: number },
  deltaTime: number,
  state: MinerState
): Miner => {
  const speed = InitialSpeed * (state === "moving" ? 1 : 2);
  const dx = targetPosition.x - miner.position.x;
  const dy = targetPosition.y - miner.position.y;
  // console.log(dx, dy);
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
  // console.log(miner.position.x, miner.position.y);

  return {
    ...miner,
    position: {
      x: miner.position.x + moveX,
      y: miner.position.y + moveY,
    },
  };
};
