import {
  FirstNames,
  InitialSpeed,
  LastNames,
  MinerTypes,
} from "@/constants/Miners";
import {
  AnimationType,
  InitialTileWidth,
  LayerName,
  SpriteName,
  Sprites,
} from "@/constants/Sprites";
import { Miner, MinerState, MinerType } from "@/interfaces/MinerTypes";
import { Ore, OreType } from "@/interfaces/OreTypes";
import { MapLayerType, minerSprites } from "./mapLogic";
import { MineTypes } from "@/constants/Mine";
import { MapDimensions, MapPosition } from "@/interfaces/MapTypes";
import {
  getMinerDirection,
  getMinerDirectionByTwoPos,
  initializeMinerMovement,
} from "./minerMovement";
import { createMinerTilesetTexture } from "@/utils/spriteLoader";
import { AnimatedSprite } from "@/interfaces/PixiTypes";

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
  position: MapPosition,
  mapDimensions: MapDimensions,
  isBot: boolean,
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
    movement: initializeMinerMovement(position, mapDimensions),
    state: "seeking",
    inventory: { ...DEFAULT_INVENTORY },
    inventoryValue: 0,
    lastDroppedValue: 0,
    miningProgress: 0,
    restProgress: 0,
    restDuration: 0,
    cost: typeData.baseCost,
    isBot: isBot || false,
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
): MapPosition[] => {
  const validPositions: MapPosition[] = [];

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

export const updateMinerPositionsRandomly = (
  miners: Miner[],
  validPositions: MapPosition[],
  activeMine: string,
  mapDimensions: MapDimensions
): void => {
  // Get the mine configuration
  const mine = MineTypes.find((m) => m.id === activeMine);
  if (!mine) return;

  // Generate new positions for miners
  const generatedPositions = generateMinerPositions(
    validPositions,
    miners.length
  );

  // Update each miner's position
  miners.forEach((miner, index) => {
    if (generatedPositions[index]) {
      miner.movement = {
        ...miner.movement,
        currentTilePos: generatedPositions[index],
        targetTilePos: generatedPositions[index],
        path: [],
        currentPathIndex: 0,
        isMoving: false,
        moveProgress: 0,
      };
    }
  });
};

// Helper function to generate miner positions
const generateMinerPositions = (
  validPositions: MapPosition[],
  count: number
): MapPosition[] => {
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

  return selectedPositions;
};

export const calculateInventoryValue = (
  inventory: MinerInventory,
  oreValues: Record<OreType, { value: number }>
): number => {
  return Object.entries(inventory).reduce((total, [oreType, amount]) => {
    return total + amount * (oreValues[oreType as OreType]?.value || 0);
  }, 0);
};

export const calculateDistance = (
  pos1: MapPosition,
  pos2: MapPosition
): number => {
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
  deltaTime: number,
  state: MinerState
): Miner => {
  const speed = InitialSpeed * (state === "moving" ? 1 : 2);
  const moveAmount = speed * deltaTime;
  const newState = { ...miner.movement };

  newState.moveProgress += moveAmount;

  if (newState.moveProgress >= 1) {
    newState.moveProgress = 0;
    newState.currentPathIndex++;
  }

  // if i've reached the target position, stop moving
  if (newState.currentPathIndex >= newState.path.length - 1) {
    newState.isMoving = false;
    newState.targetTilePos = { ...newState.currentTilePos };
    newState.path = [];
  }

  newState.currentTilePos = {
    ...newState.path[newState.currentPathIndex],
  };

  return { ...miner, movement: newState };
};

export const getMinerAnimationType = (
  miner: Miner,
  ores: Ore[]
): AnimationType => {
  if (miner.state === "mining") {
    const targetOre = ores.find((ore) => ore.id === miner.targetOreId);
    if (targetOre) {
      const direction = getMinerDirectionByTwoPos(
        miner.movement.currentTilePos,
        targetOre.position
      ) as AnimationType;
      return direction;
    }
  } else if (miner.state === "moving" || miner.state === "returning") {
    const direction = getMinerDirection(miner) as AnimationType;
    return direction;
  }
  return AnimationType.Standing;
};
