import { MinerType } from "@/interfaces/MinerTypes";

export const InitialSpeed = 5;

export const MinerTypes: Record<
  MinerType,
  {
    baseEfficiency: number;
    baseSpeed: number;
    baseCapacity: number;
    baseCost: number;
    energy: {
      recovery: number;
      movingConsumption: number;
      miningConsumption: number;
    };
    description: string;
  }
> = {
  basic: {
    baseEfficiency: 1,
    baseSpeed: 1,
    baseCapacity: 10,
    baseCost: 10,
    energy: {
      recovery: 3,
      movingConsumption: 4,
      miningConsumption: 10,
    },
    description: "A standard miner that can mine any ore type.",
  },
  expert: {
    baseEfficiency: 2.5,
    baseSpeed: 0.8,
    baseCapacity: 12,
    baseCost: 50,
    energy: {
      recovery: 5,
      movingConsumption: 7,
      miningConsumption: 15,
    },
    description:
      "Specialized in mining specific ore types with high efficiency (+150% bonus).",
  },
  hauler: {
    baseEfficiency: 0.8,
    baseSpeed: 1.8,
    baseCapacity: 35,
    baseCost: 75,
    energy: {
      recovery: 8,
      movingConsumption: 10,
      miningConsumption: 20,
    },
    description:
      "Very fast movement and extra large carrying capacity for efficient transport.",
  },
  prospector: {
    baseEfficiency: 1.2,
    baseSpeed: 1.4,
    baseCapacity: 8,
    baseCost: 100,
    energy: {
      recovery: 10,
      movingConsumption: 12,
      miningConsumption: 25,
    },
    description:
      "Prioritizes valuable ores and finds them faster than other miners.",
  },
  engineer: {
    baseEfficiency: 3.5,
    baseSpeed: 1.1,
    baseCapacity: 25,
    baseCost: 150,
    energy: {
      recovery: 15,
      movingConsumption: 20,
      miningConsumption: 50,
    },
    description:
      "Advanced miner with exceptional mining efficiency (+150% yield bonus) and large capacity.",
  },
};

// First names and last names for random miner name generation
export const FirstNames = [
  "Digger",
  "Rocky",
  "Cole",
  "Flint",
  "Rusty",
  "Dusty",
  "Granite",
  "Slate",
  "Amber",
  "Crystal",
  "Jade",
  "Ruby",
  "Onyx",
  "Cobalt",
  "Copper",
  "Silver",
  "Iron",
  "Steel",
  "Gold",
  "Titanium",
];

export const LastNames = [
  "Pickaxe",
  "Hammer",
  "Drill",
  "Stone",
  "Boulder",
  "Rock",
  "Ore",
  "Nugget",
  "Miner",
  "Digger",
  "Delver",
  "Tunneler",
  "Excavator",
  "Prospector",
  "Smith",
  "Forge",
  "Quarry",
  "Mine",
  "Vein",
  "Lode",
];
