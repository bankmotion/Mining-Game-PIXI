import { Miner, MinerType, calculateDistance, calculateInventoryValue, moveMinerTowards } from './miners';
import { Ore, OreType, depleteOreVein, oreData, updateOreRegeneration } from './ores';

export interface MineType {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  resourceMultiplier: number;
  rareOreChance: number;
  oreCount: number;
  basePosition: { x: number, y: number };
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  effect: (state: GameState, level: number) => GameState;
  maxLevel?: number;
}

export interface GameState {
  miners: Miner[];
  ores: Ore[];
  resources: Record<OreType, number>;
  resourceRate: Record<OreType, number>;
  money: number;
  moneyRate: number;
  upgrades: Record<string, number>;
  tick: number;
  lastUpdateTime: number;
  activeMine: string;
  mines: Record<string, MineType>;
}

export const mineTypes: MineType[] = [
  {
    id: 'starter',
    name: 'Starter Quarry',
    description: 'A basic mining area with common resources.',
    cost: 0,
    unlocked: true,
    resourceMultiplier: 1,
    rareOreChance: 1,
    oreCount: 20,
    basePosition: { x: 15, y: 15 },
  },
  {
    id: 'advanced',
    name: 'Advanced Excavation',
    description: 'A more advanced mining area with better resource yield.',
    cost: 1000,
    unlocked: false,
    resourceMultiplier: 2,
    rareOreChance: 1.5,
    oreCount: 25,
    basePosition: { x: 85, y: 15 },
  },
  {
    id: 'premium',
    name: 'Premium Deposit',
    description: 'A premium mining area with significantly better resources.',
    cost: 10000,
    unlocked: false,
    resourceMultiplier: 4,
    rareOreChance: 2,
    oreCount: 30,
    basePosition: { x: 15, y: 85 },
  },
  {
    id: 'legendary',
    name: 'Legendary Cavern',
    description: 'An extraordinary mining location with extremely valuable resources.',
    cost: 50000,
    unlocked: false,
    resourceMultiplier: 8,
    rareOreChance: 3,
    oreCount: 35,
    basePosition: { x: 85, y: 85 },
  },
];

export const upgrades: UpgradeDefinition[] = [
  {
    id: 'pickaxe',
    name: 'Better Pickaxes',
    description: 'Increases mining efficiency by 30% per level',
    baseCost: 20,
    costMultiplier: 1.5,
    effect: (state: GameState, level: number) => {
      const newMiners = state.miners.map(miner => ({
        ...miner,
        efficiency: minerBaseEfficiency(miner.type) * (1 + level * 0.3),
      }));
      
      return {
        ...state,
        miners: newMiners,
      };
    },
  },
  {
    id: 'boots',
    name: 'Speed Boots',
    description: 'Increases movement speed by 25% per level',
    baseCost: 30,
    costMultiplier: 1.5,
    effect: (state: GameState, level: number) => {
      const newMiners = state.miners.map(miner => ({
        ...miner,
        speed: minerBaseSpeed(miner.type) * (1 + level * 0.25),
      }));
      
      return {
        ...state,
        miners: newMiners,
      };
    },
  },
  {
    id: 'backpack',
    name: 'Larger Backpack',
    description: 'Increases carrying capacity by 40% per level',
    baseCost: 50,
    costMultiplier: 1.6,
    effect: (state: GameState, level: number) => {
      const newMiners = state.miners.map(miner => ({
        ...miner,
        capacity: minerBaseCapacity(miner.type) * (1 + level * 0.4),
      }));
      
      return {
        ...state,
        miners: newMiners,
      };
    },
  },
  {
    id: 'scanner',
    name: 'Ore Scanner',
    description: 'Increases chance of finding rare ores',
    baseCost: 100,
    costMultiplier: 2,
    effect: (state: GameState) => {
      return state;
    },
    maxLevel: 5,
  },
];

const minerBaseEfficiency = (type: MinerType): number => {
  return {
    basic: 1,
    expert: 2.5,
    hauler: 0.8,
    prospector: 1.2,
    engineer: 3.5,
  }[type];
};

const minerBaseSpeed = (type: MinerType): number => {
  return {
    basic: 1,
    expert: 0.8,
    hauler: 1.8,
    prospector: 1.4,
    engineer: 1.1,
  }[type];
};

const minerBaseCapacity = (type: MinerType): number => {
  return {
    basic: 10,
    expert: 12,
    hauler: 35,
    prospector: 8,
    engineer: 25,
  }[type];
};

export const calculateUpgradeCost = (
  upgrade: UpgradeDefinition,
  currentLevel: number
): number => {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
};

export const calculateMinerCost = (
  type: MinerType,
  currentCount: number
): number => {
  const baseCost = {
    basic: 10,
    expert: 50,
    hauler: 75,
    prospector: 100,
    engineer: 150,
  }[type];
  
  return Math.floor(baseCost * Math.pow(1.2, currentCount));
};

export const findNearestOre = (
  miner: Miner,
  ores: Ore[],
  miners: Miner[]
): Ore | undefined => {
  const availableOres = ores.filter(ore => {
    if (ore.depleted) return false;
    
    const isTargeted = miners.some(m => 
      m.id !== miner.id && 
      m.targetOreId === ore.id && 
      (m.state === 'mining' || m.state === 'moving')
    );
    
    return !isTargeted;
  });
  
  if (availableOres.length === 0) return undefined;
  
  if (miner.type === 'expert' && miner.specialization) {
    const specializedOres = availableOres.filter(ore => ore.type === miner.specialization);
    if (specializedOres.length > 0) {
      let closestOre = specializedOres[0];
      let closestDistance = calculateDistance(miner.position, closestOre.position);
      
      for (let i = 1; i < specializedOres.length; i++) {
        const ore = specializedOres[i];
        const distance = calculateDistance(miner.position, ore.position);
        if (distance < closestDistance) {
          closestOre = ore;
          closestDistance = distance;
        }
      }
      
      return closestOre;
    }
  }
  
  if (miner.type === 'prospector') {
    const valuableOres = [...availableOres].sort((a, b) => oreData[b.type].value - oreData[a.type].value);
    const topOres = valuableOres.slice(0, Math.max(1, Math.floor(valuableOres.length * 0.3)));
    
    if (topOres.length > 0) {
      let closestOre = topOres[0];
      let closestDistance = calculateDistance(miner.position, closestOre.position);
      
      for (let i = 1; i < topOres.length; i++) {
        const ore = topOres[i];
        const distance = calculateDistance(miner.position, ore.position);
        if (distance < closestDistance) {
          closestOre = ore;
          closestDistance = distance;
        }
      }
      
      return closestOre;
    }
  }
  
  if (miner.type === 'engineer') {
    const hardOres = [...availableOres].sort((a, b) => oreData[b.type].hardness - oreData[a.type].hardness);
    const topHardOres = hardOres.slice(0, Math.max(1, Math.floor(hardOres.length * 0.5)));
    
    if (topHardOres.length > 0) {
      let closestOre = topHardOres[0];
      let closestDistance = calculateDistance(miner.position, closestOre.position);
      
      for (let i = 1; i < topHardOres.length; i++) {
        const ore = topHardOres[i];
        const distance = calculateDistance(miner.position, ore.position);
        if (distance < closestDistance) {
          closestOre = ore;
          closestDistance = distance;
        }
      }
      
      return closestOre;
    }
  }
  
  let closestOre = availableOres[0];
  let closestDistance = calculateDistance(miner.position, closestOre.position);
  
  for (let i = 1; i < availableOres.length; i++) {
    const ore = availableOres[i];
    const distance = calculateDistance(miner.position, ore.position);
    if (distance < closestDistance) {
      closestOre = ore;
      closestDistance = distance;
    }
  }
  
  return closestOre;
};

export const calculateResourceYield = (
  miner: Miner,
  ore: Ore,
  upgradeLevel: number = 0,
  mineMultiplier: number = 1
): number => {
  let yield_ = ore.baseYield;
  
  yield_ *= miner.efficiency;
  
  yield_ *= (1 + upgradeLevel * 0.3);
  
  if (miner.type === 'expert' && miner.specialization === ore.type) {
    yield_ *= 2.5;
  }
  
  if (miner.type === 'engineer') {
    yield_ *= 1.5;
    yield_ *= (1 + (oreData[ore.type].hardness / 10));
  }
  
  yield_ *= mineMultiplier;
  
  yield_ *= 0.85 + (Math.random() * 0.3);
  
  return Math.max(1, Math.round(yield_));
};

export const isInventoryFull = (miner: Miner): boolean => {
  const totalItems = Object.values(miner.inventory).reduce((sum, count) => sum + count, 0);
  return totalItems >= miner.capacity;
};

export const updateMinerState = (
  miner: Miner,
  ores: Ore[],
  miners: Miner[],
  deltaTime: number,
  upgrades: Record<string, number>,
  mineMultiplier: number = 1,
  basePosition: { x: number, y: number } = { x: 15, y: 15 }
): { updatedMiner: Miner; updatedOre?: Ore; collectedResources?: { type: OreType; amount: number } } => {
  let updatedMiner = { ...miner };
  let updatedOre: Ore | undefined;
  let collectedResources: { type: OreType; amount: number } | undefined;
  
  switch (miner.state) {
    case 'seeking': {
      // If inventory is full, head to base
      if (isInventoryFull(miner)) {
        updatedMiner = {
          ...updatedMiner,
          state: 'returning',
          targetOreId: undefined,
          targetPosition: { ...basePosition },
        };
        break;
      }
      
      const nearestOre = findNearestOre(miner, ores, miners);
      
      if (nearestOre) {
        updatedMiner = {
          ...updatedMiner,
          state: 'moving',
          targetOreId: nearestOre.id,
          targetPosition: { ...nearestOre.position },
        };
      }
      break;
    }
    
    case 'moving': {
      const targetOre = ores.find(ore => ore.id === miner.targetOreId);
      
      if (!targetOre || targetOre.depleted) {
        updatedMiner = {
          ...updatedMiner,
          state: 'seeking',
          targetOreId: undefined,
          targetPosition: undefined,
        };
        break;
      }
      
      if (miner.targetPosition) {
        updatedMiner = moveMinerTowards(updatedMiner, miner.targetPosition, deltaTime);
        
        if (!updatedMiner.targetPosition) {
          updatedMiner = {
            ...updatedMiner,
            state: 'mining',
            miningProgress: 0,
          };
        }
      } else {
        updatedMiner = {
          ...updatedMiner,
          targetPosition: { ...targetOre.position },
        };
      }
      break;
    }
    
    case 'mining': {
      const targetOre = ores.find(ore => ore.id === miner.targetOreId);
      
      if (!targetOre || targetOre.depleted) {
        updatedMiner = {
          ...updatedMiner,
          state: 'seeking',
          targetOreId: undefined,
          targetPosition: undefined,
          miningProgress: 0,
        };
        break;
      }
      
      if (isInventoryFull(miner)) {
        updatedMiner = {
          ...updatedMiner,
          state: 'returning',
          targetOreId: undefined,
          targetPosition: { ...basePosition },
          miningProgress: 0,
        };
        break;
      }
      
      const oreHardnessMultiplier = targetOre.hardness;
      const pickaxeLevel = upgrades['pickaxe'] || 0;
      const pickaxeBonus = 1 + (pickaxeLevel * 0.3);
      
      const valueMultiplier = 1 + (oreData[targetOre.type].value / 10);
      const miningSpeed = (miner.efficiency * pickaxeBonus) / (oreHardnessMultiplier * valueMultiplier);
      
      const newMiningProgress = miner.miningProgress + miningSpeed * deltaTime;
      
      if (newMiningProgress >= 1) {
        const resourceAmount = calculateResourceYield(miner, targetOre, upgrades['pickaxe'] || 0, mineMultiplier);
        
        const updatedInventory = { ...miner.inventory };
        updatedInventory[targetOre.type] = (updatedInventory[targetOre.type] || 0) + resourceAmount;
        
        const oreBaseValue = oreData[targetOre.type].value;
        
        updatedOre = depleteOreVein(targetOre);
        
        collectedResources = {
          type: targetOre.type,
          amount: resourceAmount,
        };
        
        updatedMiner = {
          ...updatedMiner,
          state: 'seeking',
          targetOreId: undefined,
          targetPosition: undefined,
          miningProgress: 0,
          inventory: updatedInventory,
          inventoryValue: calculateInventoryValue(updatedInventory, oreData),
        };
      } else {
        updatedMiner = {
          ...updatedMiner,
          miningProgress: newMiningProgress,
        };
      }
      break;
    }
    
    case 'returning': {
      if (miner.targetPosition) {
        updatedMiner = moveMinerTowards(updatedMiner, miner.targetPosition, deltaTime);
        
        if (!updatedMiner.targetPosition) {
          updatedMiner = {
            ...updatedMiner,
            state: 'resting',
            restProgress: 0,
            restDuration: 5, // Base resting time in seconds
          };
        }
      } else {
        updatedMiner = {
          ...updatedMiner,
          targetPosition: { ...basePosition },
        };
      }
      break;
    }
    
    case 'resting': {
      // New state for resting at base
      const restSpeed = deltaTime;
      const newRestProgress = (updatedMiner.restProgress || 0) + restSpeed;
      
      if (newRestProgress >= (updatedMiner.restDuration || 5)) {
        // Resting complete, calculate value of all resources
        const moneyGained = updatedMiner.inventoryValue;
        
        // Empty inventory
        const emptyInventory: Record<OreType, number> = {
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
        };
        
        // Return to seeking state with empty inventory
        updatedMiner = {
          ...updatedMiner,
          state: 'seeking',
          inventory: emptyInventory,
          inventoryValue: 0,
          restProgress: 0,
          restDuration: 0,
        };
        
        collectedResources = {
          type: 'coal', // Dummy value - we'll use the real collection in updateGameState
          amount: moneyGained,
        };
      } else {
        updatedMiner = {
          ...updatedMiner,
          restProgress: newRestProgress,
        };
      }
      break;
    }
  }
  
  return { updatedMiner, updatedOre, collectedResources };
};

export const updateGameState = (state: GameState, deltaTime: number): GameState => {
  const newState = { ...state };
  
  newState.ores = updateOreRegeneration(state.ores, deltaTime);
  
  const updatedMiners: Miner[] = [];
  const updatedOres = [...newState.ores];
  const collectionsToProcess: Array<{ type: OreType; amount: number }> = [];
  
  const activeMine = state.mines[state.activeMine];
  const mineMultiplier = activeMine ? activeMine.resourceMultiplier : 1;
  const basePosition = activeMine ? activeMine.basePosition : { x: 15, y: 15 };
  
  for (const miner of state.miners) {
    const { updatedMiner, updatedOre, collectedResources } = updateMinerState(
      miner,
      updatedOres,
      state.miners,
      deltaTime,
      state.upgrades,
      mineMultiplier,
      basePosition
    );
    
    updatedMiners.push(updatedMiner);
    
    if (updatedOre) {
      const oreIndex = updatedOres.findIndex(ore => ore.id === updatedOre.id);
      if (oreIndex >= 0) {
        updatedOres[oreIndex] = updatedOre;
      }
    }
    
    if (collectedResources) {
      collectionsToProcess.push(collectedResources);
    }
  }
  
  newState.miners = updatedMiners;
  newState.ores = updatedOres;
  
  let moneyGained = 0;
  const newResources = { ...state.resources };
  
  // Process resources dropped off at base - now only happens when resting is complete
  for (const miner of updatedMiners) {
    if (miner.state === 'seeking' && miner.restProgress === 0 && miner.inventoryValue === 0) {
      // This miner just completed resting and dropping off resources
      moneyGained += miner.lastDroppedValue || 0;
      miner.lastDroppedValue = 0;
    } else if (miner.state === 'resting' && miner.restProgress === 0) {
      // Just started resting - record resources for stats
      for (const [oreType, amount] of Object.entries(miner.inventory)) {
        if (amount > 0) {
          newResources[oreType as OreType] = (newResources[oreType as OreType] || 0) + amount;
        }
      }
      miner.lastDroppedValue = miner.inventoryValue;
    }
  }
  
  const resourceRates: Record<OreType, number> = {
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
  };
  
  newState.tick += 1;
  newState.lastUpdateTime = Date.now();
  
  const moneyRate = moneyGained / deltaTime;
  
  return {
    ...newState,
    resources: newResources,
    resourceRate: resourceRates,
    money: state.money + moneyGained,
    moneyRate,
  };
};

export const initializeGameState = (): GameState => {
  const mines: Record<string, MineType> = {};
  mineTypes.forEach(mine => {
    mines[mine.id] = { ...mine };
  });

  return {
    miners: [],
    ores: [],
    resources: {
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
    resourceRate: {
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
    money: 50,
    moneyRate: 0,
    upgrades: {},
    tick: 0,
    lastUpdateTime: Date.now(),
    activeMine: 'starter',
    mines,
  };
};

export const unlockMine = (state: GameState, mineId: string): GameState => {
  const mine = state.mines[mineId];
  
  if (!mine || mine.unlocked) {
    return state;
  }
  
  if (state.money < mine.cost) {
    return state;
  }
  
  return {
    ...state,
    money: state.money - mine.cost,
    mines: {
      ...state.mines,
      [mineId]: {
        ...mine,
        unlocked: true,
      },
    },
  };
};

export const setActiveMine = (state: GameState, mineId: string): GameState => {
  const mine = state.mines[mineId];
  
  if (!mine || !mine.unlocked) {
    return state;
  }
  
  if (state.activeMine !== mineId) {
    return {
      ...state,
      activeMine: mineId,
      miners: state.miners.map(miner => ({
        ...miner,
        state: 'seeking',
        targetOreId: undefined,
        targetPosition: { x: 50, y: 50 },
      })),
    };
  }
  
  return state;
};

export const generateOresForMine = (mineId: string, state: GameState): Ore[] => {
  const mine = state.mines[mineId];
  if (!mine) return [];
  
  const { generateInitialOres } = require('./ores');
  
  return generateInitialOres(mine.oreCount, 100, 100, mine.rareOreChance);
};
