import { MineTypes } from "@/constants/Mine";
import { OreData } from "@/constants/Ore";
import { GameState } from "@/interfaces/GameType";
import { Miner } from "@/interfaces/MinerTypes";
import { MineType } from "@/interfaces/MineType";
import { Ore, OreType } from "@/interfaces/OreTypes";
import {
  calculateDistance,
  calculateInventoryValue,
  moveMinerTowards,
} from "./miners";
import {
  depleteOreVein,
  generateInitialOres,
  updateOreRegeneration,
} from "./ores";
import { EnergyState } from "@/interfaces/EnergyTypes";
import { updateEnergyState } from "./energyLogic";
import { InitialEnergyState } from "@/constants/Energy";

export const findNearestOre = (
  miner: Miner,
  ores: Ore[],
  miners: Miner[]
): Ore | undefined => {
  const availableOres = ores.filter((ore) => {
    if (ore.depleted) return false;

    const isTargeted = miners.some(
      (m) =>
        m.id !== miner.id &&
        m.targetOreId === ore.id &&
        (m.state === "mining" || m.state === "moving")
    );

    return !isTargeted;
  });

  if (availableOres.length === 0) return undefined;

  if (miner.type === "expert" && miner.specialization) {
    const specializedOres = availableOres.filter(
      (ore) => ore.type === miner.specialization
    );
    if (specializedOres.length > 0) {
      let closestOre = specializedOres[0];
      let closestDistance = calculateDistance(
        miner.position,
        closestOre.position
      );

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

  if (miner.type === "prospector") {
    const valuableOres = [...availableOres].sort(
      (a, b) => OreData[b.type].value - OreData[a.type].value
    );
    const topOres = valuableOres.slice(
      0,
      Math.max(1, Math.floor(valuableOres.length * 0.3))
    );

    if (topOres.length > 0) {
      let closestOre = topOres[0];
      let closestDistance = calculateDistance(
        miner.position,
        closestOre.position
      );

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

  if (miner.type === "engineer") {
    const hardOres = [...availableOres].sort(
      (a, b) => OreData[b.type].hardness - OreData[a.type].hardness
    );
    const topHardOres = hardOres.slice(
      0,
      Math.max(1, Math.floor(hardOres.length * 0.5))
    );

    if (topHardOres.length > 0) {
      let closestOre = topHardOres[0];
      let closestDistance = calculateDistance(
        miner.position,
        closestOre.position
      );

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

  yield_ *= 1 + upgradeLevel * 0.3;

  if (miner.type === "expert" && miner.specialization === ore.type) {
    yield_ *= 2.5;
  }

  if (miner.type === "engineer") {
    yield_ *= 1.5;
    yield_ *= 1 + OreData[ore.type].hardness / 10;
  }

  yield_ *= mineMultiplier;

  yield_ *= 0.85 + Math.random() * 0.3;

  return Math.max(1, Math.round(yield_));
};

export const isInventoryFull = (miner: Miner): boolean => {
  const totalItems = Object.values(miner.inventory).reduce(
    (sum, count) => sum + count,
    0
  );
  return totalItems >= miner.capacity;
};

export const updateMinerState = (
  miner: Miner,
  ores: Ore[],
  miners: Miner[],
  deltaTime: number,
  upgrades: Record<string, number>,
  mineMultiplier: number = 1,
  basePosition: { x: number; y: number } = { x: 15, y: 15 },
  energyState: EnergyState
): {
  updatedMiner: Miner;
  updatedOre?: Ore;
  collectedResources?: { type: OreType; amount: number };
} => {
  let updatedMiner = { ...miner };
  let updatedOre: Ore | undefined;
  let collectedResources: { type: OreType; amount: number } | undefined;

  // If blackout, freeze all actions
  if (energyState.isBlackout) {
    return {
      updatedMiner: {
        ...updatedMiner,
        state: "seeking",
        targetOreId: undefined,
        targetPosition: undefined,
      },
    };
  }

  switch (miner.state) {
    case "seeking": {
      // If inventory is full, head to base
      if (isInventoryFull(miner)) {
        updatedMiner = {
          ...updatedMiner,
          state: "returning",
          targetOreId: undefined,
          targetPosition: { ...basePosition },
        };
        break;
      }

      // Check if miner has reached their target position
      if (
        miner?.targetPosition &&
        Math.abs(miner.position.x - miner.targetPosition.x) < 0.1 &&
        Math.abs(miner.position.y - miner.targetPosition.y) < 0.1
      ) {
        const targetOre = ores.find((ore) => ore.id === miner.targetOreId);
        if (targetOre && !targetOre.depleted) {
          updatedMiner = {
            ...updatedMiner,
            state: "mining",
            miningProgress: 0,
          };
        }
      }
      break;
    }

    case "moving": {
      const targetOre = ores.find((ore) => ore.id === miner.targetOreId);

      if (miner.targetPosition) {
        updatedMiner = moveMinerTowards(
          updatedMiner,
          miner.targetPosition,
          deltaTime
        );

        // Check if miner has reached the target position
        if (
          Math.abs(updatedMiner.position.x - miner.targetPosition.x) < 0.1 &&
          Math.abs(updatedMiner.position.y - miner.targetPosition.y) < 0.1
        ) {
          updatedMiner = {
            ...updatedMiner,
            state: "mining",
            miningProgress: 0,
          };
        }
      } else if (targetOre) {
        updatedMiner = {
          ...updatedMiner,
          targetPosition: { ...targetOre.position },
        };
      }
      break;
    }

    case "mining": {
      const targetOre = ores.find((ore) => ore.id === miner.targetOreId);

      if (!targetOre || targetOre.depleted) {
        updatedMiner = {
          ...updatedMiner,
          state: "seeking",
          miningProgress: 0,
        };
        break;
      }

      if (isInventoryFull(miner)) {
        updatedMiner = {
          ...updatedMiner,
          state: "returning",
          targetOreId: undefined,
          targetPosition: { ...basePosition },
          miningProgress: 0,
        };
        break;
      }

      const oreHardnessMultiplier = targetOre.hardness;
      const pickaxeLevel = upgrades["pickaxe"] || 0;
      const pickaxeBonus = 1 + pickaxeLevel * 0.3;

      const valueMultiplier = 1 + OreData[targetOre.type].value / 10;
      const miningSpeed =
        (miner.efficiency * pickaxeBonus) /
        (oreHardnessMultiplier * valueMultiplier);

      const newMiningProgress = miner.miningProgress + miningSpeed * deltaTime;

      if (newMiningProgress >= 1) {
        const resourceAmount = calculateResourceYield(
          miner,
          targetOre,
          upgrades["pickaxe"] || 0,
          mineMultiplier
        );

        const updatedInventory = { ...miner.inventory };
        updatedInventory[targetOre.type] =
          (updatedInventory[targetOre.type] || 0) + resourceAmount;

        updatedOre = depleteOreVein(targetOre);

        collectedResources = {
          type: targetOre.type,
          amount: resourceAmount,
        };

        updatedMiner = {
          ...updatedMiner,
          state: "seeking",
          miningProgress: 0,
          inventory: updatedInventory,
          inventoryValue: calculateInventoryValue(updatedInventory, OreData),
        };
      } else {
        updatedMiner = {
          ...updatedMiner,
          miningProgress: newMiningProgress,
        };
      }
      break;
    }

    case "returning": {
      if (miner.targetPosition) {
        updatedMiner = moveMinerTowards(
          updatedMiner,
          miner.targetPosition,
          deltaTime
        );

        // Check if miner has reached the base
        if (
          Math.abs(updatedMiner.position.x - basePosition.x) < 0.1 &&
          Math.abs(updatedMiner.position.y - basePosition.y) < 0.1
        ) {
          updatedMiner = {
            ...updatedMiner,
            state: "resting",
            restProgress: 0,
            restDuration: 5,
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

    case "resting": {
      const restSpeed = deltaTime;
      const newRestProgress = (updatedMiner.restProgress || 0) + restSpeed;

      if (newRestProgress >= (updatedMiner.restDuration || 5)) {
        const moneyGained = updatedMiner.inventoryValue;

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
          uranium: 0,
        };

        updatedMiner = {
          ...updatedMiner,
          state: "seeking",
          inventory: emptyInventory,
          inventoryValue: 0,
          restProgress: 0,
          restDuration: 0,
        };

        collectedResources = {
          type: "coal",
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

export const updateGameState = (
  state: GameState,
  deltaTime: number
): GameState => {
  const newState = { ...state };

  newState.energy = updateEnergyState(state.energy, state.miners, deltaTime);

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
      basePosition,
      newState.energy
    );

    updatedMiners.push(updatedMiner);

    if (updatedOre) {
      const oreIndex = updatedOres.findIndex((ore) => ore.id === updatedOre.id);
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
    if (
      miner.state === "seeking" &&
      miner.restProgress === 0 &&
      miner.inventoryValue === 0
    ) {
      // This miner just completed resting and dropping off resources
      moneyGained += miner.lastDroppedValue || 0;
      miner.lastDroppedValue = 0;
    } else if (miner.state === "resting" && miner.restProgress === 0) {
      // Just started resting - record resources for stats
      for (const [oreType, amount] of Object.entries(miner.inventory)) {
        if (amount > 0) {
          newResources[oreType as OreType] =
            (newResources[oreType as OreType] || 0) + amount;
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
    uranium: 0,
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
  MineTypes.forEach((mine) => {
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
      uranium: 0,
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
      uranium: 0,
    },
    money: 50,
    moneyRate: 0,
    upgrades: {},
    tick: 0,
    lastUpdateTime: Date.now(),
    activeMine: "starter",
    mines,
    energy: InitialEnergyState,
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
      miners: state.miners.map((miner) => ({
        ...miner,
        state: "seeking",
        targetOreId: undefined,
        targetPosition: { x: 50, y: 50 },
      })),
    };
  }

  return state;
};

export const generateOresForMine = (
  mineId: string,
  state: GameState
): Ore[] => {
  const mine = state.mines[mineId];
  if (!mine) return [];

  return generateInitialOres(mine.oreCount, 100, 100, mine.rareOreChance);
};
