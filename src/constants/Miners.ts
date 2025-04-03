import { MinerType } from "@/interfaces/MinerTypes";

export const BasePoint = { x: 19, y: 2 };
export const InitialSpeed = 5;

// Animation types for miners
// export enum MinerAnimationType {
//   Standing = "standing",
//   WalkingRight = "walking_right",
//   WalkingLeft = "walking_left",
//   WalkingUp = "walking_up",
//   WalkingDown = "walking_down",
//   Drilling = "drilling",
// }

// Animation data for different states
// export const MinerAnimations = {
//   [MinerAnimationType.Standing]: {
//     tileName: "character_push_body_green",
//     animationId: 220, // Idle animation frame ID
//     animationSpeed: 0.3,
//   },
//   [MinerAnimationType.WalkingRight]: {
//     tileName: "character_push_body_green",
//     animationId: 24, // Idle animation frame ID
//     animationSpeed: 0.3,
//   },
//   [MinerAnimationType.WalkingLeft]: {
//     tileName: "character_push_body_green",
//     animationId: 120, // Walking animation frame ID
//     animationSpeed: 0.3,
//   },
//   [MinerAnimationType.WalkingDown]: {
//     tileName: "character_push_body_green",
//     animationId: 216, // Mining animation frame ID
//     animationSpeed: 0.4, // Slightly faster for mining
//   },
//   [MinerAnimationType.WalkingUp]: {
//     tileName: "character_push_body_green",
//     animationId: 312, // Mining animation frame ID
//     animationSpeed: 0.4, // Slightly faster for mining
//   },
//   [MinerAnimationType.Drilling]: {
//     tileName: "drill_body_green",
//     animationId: 12,
//     animationSpeed: 0.3,
//   },
// };

export const MinerTypes: Record<
  MinerType,
  {
    baseEfficiency: number;
    baseSpeed: number;
    baseCapacity: number;
    baseCost: number;
    description: string;
  }
> = {
  basic: {
    baseEfficiency: 1,
    baseSpeed: 1,
    baseCapacity: 10,
    baseCost: 10,
    description: "A standard miner that can mine any ore type.",
  },
  expert: {
    baseEfficiency: 2.5,
    baseSpeed: 0.8,
    baseCapacity: 12,
    baseCost: 50,
    description:
      "Specialized in mining specific ore types with high efficiency (+150% bonus).",
  },
  hauler: {
    baseEfficiency: 0.8,
    baseSpeed: 1.8,
    baseCapacity: 35,
    baseCost: 75,
    description:
      "Very fast movement and extra large carrying capacity for efficient transport.",
  },
  prospector: {
    baseEfficiency: 1.2,
    baseSpeed: 1.4,
    baseCapacity: 8,
    baseCost: 100,
    description:
      "Prioritizes valuable ores and finds them faster than other miners.",
  },
  engineer: {
    baseEfficiency: 3.5,
    baseSpeed: 1.1,
    baseCapacity: 25,
    baseCost: 150,
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
