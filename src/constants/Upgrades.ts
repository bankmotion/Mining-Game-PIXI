import { GameState } from "@/interfaces/GameType";
import { MinerType } from "@/interfaces/MinerTypes";
import { UpgradeDefinition } from "@/interfaces/UpgradeType";

const MinerBaseEfficiency = (type: MinerType): number => {
  return {
    basic: 1,
    expert: 2.5,
    hauler: 0.8,
    prospector: 1.2,
    engineer: 3.5,
  }[type];
};

const MinerBaseSpeed = (type: MinerType): number => {
  return {
    basic: 1,
    expert: 0.8,
    hauler: 1.8,
    prospector: 1.4,
    engineer: 1.1,
  }[type];
};

const MinerBaseCapacity = (type: MinerType): number => {
  return {
    basic: 10,
    expert: 12,
    hauler: 35,
    prospector: 8,
    engineer: 25,
  }[type];
};

export const CalculateUpgradeCost = (
  upgrade: UpgradeDefinition,
  currentLevel: number
): number => {
  return Math.floor(
    upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel)
  );
};

export const CalculateMinerCost = (
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

export const Upgrades: UpgradeDefinition[] = [
  {
    id: "pickaxe",
    name: "Better Pickaxes",
    description: "Increases mining efficiency by 30% per level",
    baseCost: 20,
    costMultiplier: 1.5,
    effect: (state: GameState, level: number) => {
      const newMiners = state.miners.map((miner) => ({
        ...miner,
        efficiency: MinerBaseEfficiency(miner.type) * (1 + level * 0.3),
      }));

      return {
        ...state,
        miners: newMiners,
      };
    },
  },
  {
    id: "boots",
    name: "Speed Boots",
    description: "Increases movement speed by 25% per level",
    baseCost: 30,
    costMultiplier: 1.5,
    effect: (state: GameState, level: number) => {
      const newMiners = state.miners.map((miner) => ({
        ...miner,
        speed: MinerBaseSpeed(miner.type) * (1 + level * 0.25),
      }));

      return {
        ...state,
        miners: newMiners,
      };
    },
  },
  {
    id: "backpack",
    name: "Larger Backpack",
    description: "Increases carrying capacity by 40% per level",
    baseCost: 50,
    costMultiplier: 1.6,
    effect: (state: GameState, level: number) => {
      const newMiners = state.miners.map((miner) => ({
        ...miner,
        capacity: MinerBaseCapacity(miner.type) * (1 + level * 0.4),
      }));

      return {
        ...state,
        miners: newMiners,
      };
    },
  },
  {
    id: "scanner",
    name: "Ore Scanner",
    description: "Increases chance of finding rare ores",
    baseCost: 100,
    costMultiplier: 2,
    effect: (state: GameState) => {
      return state;
    },
    maxLevel: 5,
  },
];
