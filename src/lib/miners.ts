
import { OreType } from './ores';

export type MinerState = 'seeking' | 'moving' | 'mining' | 'returning' | 'resting';
export type MinerType = 'basic' | 'expert' | 'hauler' | 'prospector' | 'engineer';

export interface Miner {
  id: string;
  name: string;
  type: MinerType;
  efficiency: number;
  speed: number;
  capacity: number;
  specialization?: OreType;
  position: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  state: MinerState;
  inventory: Record<OreType, number>;
  inventoryValue: number;
  lastDroppedValue?: number;
  targetOreId?: string;
  miningProgress: number;
  restProgress?: number;
  restDuration?: number;
  cost: number;
}

export const minerTypes: Record<MinerType, {
  baseEfficiency: number;
  baseSpeed: number;
  baseCapacity: number;
  baseCost: number;
  description: string;
}> = {
  basic: {
    baseEfficiency: 1,
    baseSpeed: 1,
    baseCapacity: 10,
    baseCost: 10,
    description: 'A standard miner that can mine any ore type.',
  },
  expert: {
    baseEfficiency: 2.5,
    baseSpeed: 0.8,
    baseCapacity: 12,
    baseCost: 50,
    description: 'Specialized in mining specific ore types with high efficiency (+150% bonus).',
  },
  hauler: {
    baseEfficiency: 0.8,
    baseSpeed: 1.8,
    baseCapacity: 35,
    baseCost: 75,
    description: 'Very fast movement and extra large carrying capacity for efficient transport.',
  },
  prospector: {
    baseEfficiency: 1.2,
    baseSpeed: 1.4,
    baseCapacity: 8,
    baseCost: 100,
    description: 'Prioritizes valuable ores and finds them faster than other miners.',
  },
  engineer: {
    baseEfficiency: 3.5,
    baseSpeed: 1.1,
    baseCapacity: 25,
    baseCost: 150,
    description: 'Advanced miner with exceptional mining efficiency (+150% yield bonus) and large capacity.',
  },
};

// First names and last names for random miner name generation
const firstNames = [
  'Digger', 'Rocky', 'Cole', 'Flint', 'Rusty', 'Dusty', 'Granite', 'Slate', 'Amber', 'Crystal',
  'Jade', 'Ruby', 'Onyx', 'Cobalt', 'Copper', 'Silver', 'Iron', 'Steel', 'Gold', 'Titanium',
];

const lastNames = [
  'Pickaxe', 'Hammer', 'Drill', 'Stone', 'Boulder', 'Rock', 'Ore', 'Nugget', 'Miner', 'Digger',
  'Delver', 'Tunneler', 'Excavator', 'Prospector', 'Smith', 'Forge', 'Quarry', 'Mine', 'Vein', 'Lode',
];

// Generate a random miner name
export const generateMinerName = (): string => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

// Create a new miner of a specific type
export const createMiner = (type: MinerType, position: { x: number; y: number }, specialization?: OreType): Miner => {
  const typeData = minerTypes[type];
  
  const miner: Miner = {
    id: `miner-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: generateMinerName(),
    type,
    efficiency: typeData.baseEfficiency,
    speed: typeData.baseSpeed,
    capacity: typeData.baseCapacity,
    position: { ...position },
    state: 'seeking',
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
      uranium: 0
    },
    inventoryValue: 0,
    lastDroppedValue: 0,
    miningProgress: 0,
    restProgress: 0,
    restDuration: 0,
    cost: typeData.baseCost,
  };
  
  if (specialization && type === 'expert') {
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
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Move a miner towards a target position
export const moveMinerTowards = (
  miner: Miner,
  targetPosition: { x: number; y: number },
  deltaTime: number
): Miner => {
  const distance = calculateDistance(miner.position, targetPosition);
  
  if (distance < 0.1) {
    // Target reached
    return {
      ...miner,
      position: { ...targetPosition },
      targetPosition: undefined,
    };
  }
  
  // Calculate movement direction and new position
  const direction = {
    x: (targetPosition.x - miner.position.x) / distance,
    y: (targetPosition.y - miner.position.y) / distance,
  };
  
  const moveSpeed = miner.speed * 5 * deltaTime; // Boost base movement speed to make upgrades more noticeable
  const moveFactor = Math.min(moveSpeed, distance);
  
  const newPosition = {
    x: miner.position.x + direction.x * moveFactor,
    y: miner.position.y + direction.y * moveFactor,
  };
  
  return {
    ...miner,
    position: newPosition,
    targetPosition: targetPosition,
  };
};
